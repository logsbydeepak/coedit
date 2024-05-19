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

export async function getVolumeCommand(
  client: EC2Client,
  input: { projectTagId: string }
) {
  const type = 'project'
  const id = input.projectTagId

  const command = new DescribeVolumesCommand({
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

  if (!res.Volumes || res.Volumes.length === 0) {
    return r('NOT_FOUND')
  }

  return r('OK', { data: res.Volumes[0] })
}

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
  env: {
    AWS_REGION: string
  },
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
  for (let i = 0; i < 5; i++) {
    const res = await getVolumeCommand(client, { projectTagId: input.volumeId })
    if (res.code === 'OK') {
      if (res.data.State === 'available') {
        return r('OK')
      }
    }

    await wait(ms('1s'))
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
  for (let i = 0; i < 5; i++) {
    const res = await getSnapshotCommand(client, {
      projectTagId: input.snapshotId,
    })
    if (res.code === 'OK') {
      if (res.data.State === 'completed') {
        return r('OK')
      }
    }

    await wait(ms('1s'))
  }
  return r('TIMEOUT')
}

export async function createSnapshotCommand(
  client: EC2Client,
  input: { volumeId: string; projectId: string }
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
            Value: input.projectId,
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

export async function deleteSnapshotCommand(
  client: EC2Client,
  input: { snapshotId: string }
) {
  const command = new DeleteSnapshotCommand({
    SnapshotId: input.snapshotId,
  })

  await client.send(command)

  return r('OK')
}

export async function deleteVolumeCommand(
  client: EC2Client,
  input: { volumeId: string }
) {
  const command = new DeleteVolumeCommand({
    VolumeId: input.volumeId,
  })

  await client.send(command)

  return r('OK')
}
