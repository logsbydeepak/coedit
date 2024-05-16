import {
  CopySnapshotCommand,
  CreateSnapshotCommand,
  DescribeNetworkInterfacesCommand,
  DescribeSnapshotsCommand,
  DescribeVolumesCommand,
  EC2Client,
} from '@aws-sdk/client-ec2'

import { r } from '@coedit/r'

export async function getVolumeCommand(
  client: EC2Client,
  input: { projectId: string }
) {
  const type = 'project'
  const id = input.projectId

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
  input: { templateId: string } | { projectId: string }
) {
  const { type, id } =
    'templateId' in input
      ? { type: 'template', id: input.templateId }
      : {
          type: 'project',
          id: input.projectId,
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
  let count = 0
  let available = false

  async function fn() {
    const res = await getVolumeCommand(client, { projectId: input.volumeId })
    if (count > 5) {
      return
    }

    if (res.code !== 'OK') {
      count++
      await fn()
      return
    }

    if (res.data.State === 'available') {
      available = true
      return
    }

    count++
    await fn()
    return
  }

  await fn()

  if (!available) {
    return r('TIMEOUT')
  }
  return r('OK')
}

export async function waitUntilSnapshotAvailable(
  client: EC2Client,
  input: { snapshotId: string }
) {
  let count = 0
  let available = false
  let error = false

  const command = new DescribeSnapshotsCommand({
    SnapshotIds: [input.snapshotId],
  })

  async function fn() {
    const res = await client.send(command)

    if (count > 5) {
      return
    }

    if (!res.Snapshots || res.Snapshots.length === 0) {
      error = true
      return
    }

    if (res.Snapshots[0].State === 'completed') {
      available = true
      return
    }

    count++
    await fn()
    return
  }

  await fn()

  if (error) {
    return r('NOT_FOUND')
  }

  if (!available) {
    return r('TIMEOUT')
  }
  return r('OK')
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
