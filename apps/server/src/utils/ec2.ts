import {
  CopySnapshotCommand,
  CreateSnapshotCommand,
  DeleteSnapshotCommand,
  DeleteVolumeCommand,
  DescribeNetworkInterfacesCommand,
  DescribeSnapshotsCommand,
  DescribeVolumesCommand,
  EC2Client,
} from '@aws-sdk/client-ec2'
import ms from 'ms'

import { r } from '@coedit/r'

import { ENV } from './h'

export async function getSnapshotCommand(
  client: EC2Client,
  input: { templateTagId: string } | { projectTagId: string }
) {
  const { type, id } =
    'templateTagId' in input
      ? { type: 'template', id: input.templateTagId }
      : {
          type: 'project',
          id: input.projectTagId,
        }

  const command = new DescribeSnapshotsCommand({
    Filters: [
      {
        Name: 'tag:type',
        Values: [type],
      },
      {
        Name: 'tag:id',
        Values: [id],
      },
    ],
  })

  const res = await client.send(command)

  if (!res.Snapshots || res.Snapshots.length === 0) {
    return r('NOT_FOUND')
  }

  return r('OK', { data: res.Snapshots[0] })
}

export async function copySnapshotCommand(
  client: EC2Client,
  env: Pick<ENV, 'AWS_REGION'>,
  input: { sourceSnapshotId: string; projectTagId: string }
) {
  const command = new CopySnapshotCommand({
    SourceRegion: env.AWS_REGION,
    SourceSnapshotId: input.sourceSnapshotId,
    TagSpecifications: [
      {
        ResourceType: 'snapshot',
        Tags: [
          {
            Key: 'type',
            Value: 'project',
          },
          {
            Key: 'id',
            Value: input.projectTagId,
          },
        ],
      },
    ],
  })

  const res = await client.send(command)

  if (!res.SnapshotId) {
    return r('NOT_CREATED', { dat: res })
  }
  return r('OK', { data: res })
}

export async function getPublicIPCommand(
  client: EC2Client,
  input: { eniId: string }
) {
  const command = new DescribeNetworkInterfacesCommand({
    NetworkInterfaceIds: [input.eniId],
  })

  const res = await client.send(command)

  if (!res.NetworkInterfaces || res.NetworkInterfaces.length === 0) {
    return r('NOT_FOUND')
  }

  const IP = res.NetworkInterfaces[0].Association?.PublicIp
  if (!IP) {
    return r('NOT_FOUND')
  }

  return r('OK', {
    data: {
      IP,
    },
  })
}

export async function waitUntilVolumeAvailable(
  client: EC2Client,
  input: { volumeId: string }
) {
  for (let i = 0; i < 10; i++) {
    const command = new DescribeVolumesCommand({
      VolumeIds: [input.volumeId],
    })

    const res = await client.send(command)

    if (res.Volumes && res.Volumes.length > 0) {
      if (res.Volumes[0].State === 'available') {
        return r('OK')
      }
    }

    await wait(ms('10s'))
  }

  return r('TIMEOUT')
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function waitUntilSnapshotAvailable(
  client: EC2Client,
  input: { snapshotId: string }
) {
  for (let i = 0; i < 10; i++) {
    const command = new DescribeSnapshotsCommand({
      SnapshotIds: [input.snapshotId],
    })

    const res = await client.send(command)

    if (res.Snapshots && res.Snapshots.length > 0) {
      if (res.Snapshots[0].State === 'completed') {
        return r('OK')
      }
    }

    await wait(ms('10s'))
  }
  return r('TIMEOUT')
}

export async function createSnapshotCommand(
  client: EC2Client,
  input: { volumeId: string; projectTagId: string }
) {
  const command = new CreateSnapshotCommand({
    VolumeId: input.volumeId,
    TagSpecifications: [
      {
        ResourceType: 'snapshot',
        Tags: [
          {
            Key: 'type',
            Value: 'project',
          },
          {
            Key: 'id',
            Value: input.projectTagId,
          },
        ],
      },
    ],
  })

  const res = await client.send(command)

  if (!res.SnapshotId) {
    return r('INVALID_PROJECT_ID')
  }

  return r('OK', { data: res })
}

export async function getLatestVolumeORSnapshot(
  ec2Client: EC2Client,
  input: { projectTagId: string }
) {
  const allVolumesCommand = new DescribeVolumesCommand({
    Filters: [
      {
        Name: 'tag:type',
        Values: ['project'],
      },
      {
        Name: 'tag:id',
        Values: [input.projectTagId],
      },
    ],
  })

  const allSnapshotsCommand = new DescribeSnapshotsCommand({
    Filters: [
      {
        Name: 'tag:type',
        Values: ['project'],
      },
      {
        Name: 'tag:id',
        Values: [input.projectTagId],
      },
    ],
  })

  const volumesRes = ec2Client.send(allVolumesCommand)
  const snapshotsRes = ec2Client.send(allSnapshotsCommand)

  const latest = await Promise.all([volumesRes, snapshotsRes])
  if (!latest) {
    return r('NOT_FOUND')
  }

  const volumes = latest[0].Volumes
  const snapshots = latest[1].Snapshots

  if (!volumes || !snapshots) {
    return r('NOT_FOUND')
  }

  if (volumes.length === 0 && snapshots.length === 0) {
    return r('NOT_FOUND')
  }

  let latestDate = new Date(0)

  const result: {
    id: string
    type: 'volume' | 'snapshot'
  } = {
    id: '',
    type: 'volume',
  }

  for (const volume of volumes) {
    if (!volume.CreateTime) continue
    if (!volume.VolumeId) continue
    if (!(volume.CreateTime > latestDate)) continue

    latestDate = volume.CreateTime
    result.id = volume.VolumeId
    result.type = 'volume'
  }

  for (const snapshot of snapshots) {
    if (!snapshot.StartTime) continue
    if (!snapshot.SnapshotId) continue
    if (!(snapshot.StartTime > latestDate)) continue

    latestDate = snapshot.StartTime
    result.id = snapshot.SnapshotId
    result.type = 'snapshot'
  }

  volumes.forEach((volume) => {
    if (!volume.CreateTime) return
    if (!volume.VolumeId) return
    if (!(volume.CreateTime > latestDate)) return

    if (volume.CreateTime > latestDate) {
      latestDate = volume.CreateTime
      result.id = volume.VolumeId
      result.type = 'volume'
    }
  })

  snapshots.forEach((snapshot) => {
    if (!snapshot.StartTime) return
    if (!snapshot.SnapshotId) return
    if (snapshot.StartTime > latestDate) {
      latestDate = snapshot.StartTime
      result.id = snapshot.SnapshotId
      result.type = 'snapshot'
    }
  })

  return r('OK', {
    data: result,
    volumes: volumes,
    snapshots: snapshots,
  })
}

export async function freeProjectResource(
  client: EC2Client,
  input: { projectTagId: string }
) {
  const res = await getLatestVolumeORSnapshot(client, input)

  if (res.code === 'NOT_FOUND') {
    return r('NO_RESOURCE')
  }

  if (res.code === 'OK') {
    const { data, volumes, snapshots } = res
    if (!data) {
      return r('NO_RESOURCE')
    }

    if (volumes.length === 0 && snapshots.length === 1) {
      return r('NO_RESOURCE')
    }

    if (volumes.length === 1 && snapshots.length === 0) {
      return r('NO_RESOURCE')
    }

    for (const volume of volumes) {
      if (data.id === volume.VolumeId) continue
      if (volume.State !== 'available') continue

      const command = new DeleteVolumeCommand({
        VolumeId: volume.VolumeId,
      })

      await client.send(command)
    }

    for (const snapshot of snapshots) {
      if (data.id === snapshot.SnapshotId) continue
      if (snapshot.State !== 'completed') continue

      const command = new DeleteSnapshotCommand({
        SnapshotId: snapshot.SnapshotId,
      })

      await client.send(command)
    }
  }

  return r('OK')
}

export async function deleteProjectResource(
  client: EC2Client,
  input: { projectTagId: string }
) {
  const res = await getLatestVolumeORSnapshot(client, input)

  if (res.code === 'NOT_FOUND') {
    return r('NO_RESOURCE')
  }

  if (res.code === 'OK') {
    const { data, volumes, snapshots } = res
    if (!data) {
      return r('NO_RESOURCE')
    }

    for (const volume of volumes) {
      if (volume.State !== 'available') continue

      const command = new DeleteVolumeCommand({
        VolumeId: volume.VolumeId,
      })

      await client.send(command)
    }

    for (const snapshot of snapshots) {
      if (snapshot.State !== 'completed') continue

      const command = new DeleteSnapshotCommand({
        SnapshotId: snapshot.SnapshotId,
      })

      await client.send(command)
    }
  }

  return r('OK')
}
