import {
  CopySnapshotCommand,
  CreateSnapshotCommand,
  DescribeNetworkInterfacesCommand,
  DescribeSnapshotsCommand,
  DescribeVolumesCommand,
} from '@aws-sdk/client-ec2'
import { DescribeTasksCommand, RunTaskCommand } from '@aws-sdk/client-ecs'
import { zValidator } from '@hono/zod-validator'
import { and, eq } from 'drizzle-orm'
import { isValid, ulid } from 'ulidx'
import { z } from 'zod'

import { db, dbSchema } from '@coedit/db'
import { r } from '@coedit/r'
import { zReqString } from '@coedit/zschema'

import { ec2, ecs, redis } from '#/lib/config'
import { h, hAuth } from '#/utils/h'
import { KVProject } from '#/utils/project'

const ECS_CLUSTER = 'coedit-builder'
const ECS_LAUNCH_TYPE = 'FARGATE'

const createProject = hAuth().post(
  '/',
  zValidator('json', z.object({ templateId: zReqString, name: zReqString })),
  async (c) => {
    const userId = c.get('x-userId')
    const input = c.req.valid('json')

    if (!isValid(input.templateId)) {
      return c.json(r('INVALID_TEMPLATE_ID'))
    }

    const [dbTemplate] = await db(c.env)
      .select()
      .from(dbSchema.templates)
      .where(eq(dbSchema.templates.id, input.templateId))

    if (!dbTemplate) {
      return c.json(r('INVALID_TEMPLATE_ID'))
    }

    const templateSnapshotCommand = new DescribeSnapshotsCommand({
      Filters: [
        {
          Name: 'tag:type',
          Values: ['template'],
        },
        {
          Name: 'tag:id',
          Values: [input.templateId],
        },
      ],
    })

    const templateSnapshotRes = await ec2(c.env).send(templateSnapshotCommand)
    if (
      !templateSnapshotRes.Snapshots ||
      templateSnapshotRes.Snapshots.length === 0
    ) {
      return c.json(r('INVALID_TEMPLATE_ID'))
    }

    const newProjectId = ulid()

    const copySnapshotCommand = new CopySnapshotCommand({
      SourceRegion: c.env.AWS_REGION,
      SourceSnapshotId: templateSnapshotRes.Snapshots[0].SnapshotId,
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
              Value: newProjectId,
            },
          ],
        },
      ],
    })

    const copySnapshotRes = await ec2(c.env).send(copySnapshotCommand)
    if (!copySnapshotRes.SnapshotId) {
      throw new Error('Failed to copy snapshot')
    }

    await db(c.env).insert(dbSchema.projects).values({
      id: newProjectId,
      userId: userId,
      name: input.name,
    })

    return c.json(
      r('OK', {
        projectId: newProjectId,
      })
    )
  }
)

const startProject = hAuth().post(
  '/start/:id',
  zValidator(
    'param',
    z.object({
      id: zReqString,
    })
  ),
  async (c) => {
    const input = c.req.valid('param')
    const userId = c.get('x-userId')

    if (!isValid(input.id)) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    const [dbProject] = await db(c.env)
      .select()
      .from(dbSchema.projects)
      .where(
        and(
          eq(dbSchema.projects.id, input.id),
          eq(dbSchema.projects.userId, userId)
        )
      )

    if (!dbProject) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    const projectArn = await KVProject(redis(c.env), input.id).get()
    if (projectArn) {
      const describeTasksCommand = new DescribeTasksCommand({
        cluster: ECS_CLUSTER,
        tasks: [projectArn],
      })
      const describeTasksRes = await ecs(c.env).send(describeTasksCommand)
      const tasks = describeTasksRes.tasks

      if (!tasks || tasks.length !== 1) {
        await KVProject(redis(c.env), input.id).remove()
        return c.json(r('INVALID_PROJECT_ID'))
      }
      const task = tasks[0]

      if (task.desiredStatus === 'RUNNING') {
        return c.json(r('OK'))
      }
    }

    let snapshotId = ''

    const describeSnapshotCommand = new DescribeSnapshotsCommand({
      Filters: [
        {
          Name: 'tag:type',
          Values: ['project'],
        },
        {
          Name: 'tag:id',
          Values: [input.id],
        },
      ],
    })
    const describeSnapshotRes = await ec2(c.env).send(describeSnapshotCommand)

    if (
      !describeSnapshotRes.Snapshots ||
      describeSnapshotRes.Snapshots.length === 0
    ) {
      const describeVolumeCommand = new DescribeVolumesCommand({
        Filters: [
          {
            Name: 'tag:type',
            Values: ['project'],
          },
          {
            Name: 'tag:id',
            Values: [input.id],
          },
        ],
      })
      const describeVolumeCommandRes = await ec2(c.env).send(
        describeVolumeCommand
      )

      if (
        !describeVolumeCommandRes.Volumes ||
        describeVolumeCommandRes.Volumes.length === 0
      ) {
        return c.json(r('INVALID_PROJECT_ID'))
      }

      const volumeId = describeVolumeCommandRes.Volumes[0].VolumeId
      const createSnapshotCommand = new CreateSnapshotCommand({
        VolumeId: volumeId,
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
                Value: input.id,
              },
            ],
          },
        ],
      })
      const createSnapshotRes = await ec2(c.env).send(createSnapshotCommand)
      if (!createSnapshotRes.SnapshotId) {
        return c.json(r('INVALID_PROJECT_ID'))
      }

      snapshotId = createSnapshotRes.SnapshotId
    } else {
      if (describeSnapshotRes.Snapshots[0].SnapshotId) {
        snapshotId = describeSnapshotRes.Snapshots[0].SnapshotId
      }
    }

    if (!snapshotId) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    const runTaskCommand = new RunTaskCommand({
      cluster: ECS_CLUSTER,
      taskDefinition: `project-${input.id}`,
      launchType: ECS_LAUNCH_TYPE,
      count: 1,
      networkConfiguration: {
        awsvpcConfiguration: {
          securityGroups: [c.env.AWS_SECURITY_GROUP_ID],
          subnets: [c.env.AWS_SUBNET_ID],
          assignPublicIp: 'ENABLED',
        },
      },
      volumeConfigurations: [
        {
          name: 'workspace',
          managedEBSVolume: {
            tagSpecifications: [
              {
                resourceType: 'volume',
                tags: [
                  { key: 'type', value: 'project' },
                  {
                    key: 'id',
                    value: input.id,
                  },
                ],
              },
            ],
            volumeType: 'gp2',
            encrypted: false,
            snapshotId: snapshotId,
            filesystemType: 'ext4',
            sizeInGiB: 6,
            roleArn: c.env.AWS_ECS_INFRASTRUCTURE_ROLE_ARN,
            terminationPolicy: {
              deleteOnTermination: false,
            },
          },
        },
      ],
    })

    const runTaskRes = await ecs(c.env).send(runTaskCommand)
    if (!runTaskRes.tasks || runTaskRes.tasks.length === 0) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    const taskArn = runTaskRes.tasks[0].taskArn
    if (!taskArn) {
      return c.json(r('INVALID_PROJECT_ID'))
    }
    await KVProject(redis(c.env), input.id).set(taskArn)

    return c.json(r('OK'))
  }
)

const projectStatus = hAuth().get(
  '/status/:id',
  zValidator(
    'param',
    z.object({
      id: zReqString,
    })
  ),
  async (c) => {
    const input = c.req.valid('param')
    const userId = c.get('x-userId')

    if (!isValid(input.id)) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    const [dbProject] = await db(c.env)
      .select()
      .from(dbSchema.projects)
      .where(
        and(
          eq(dbSchema.projects.id, input.id),
          eq(dbSchema.projects.userId, userId)
        )
      )

    if (!dbProject) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    const projectArn = await KVProject(redis(c.env), input.id).get()
    if (!projectArn) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    const describeTasksCommand = new DescribeTasksCommand({
      cluster: ECS_CLUSTER,
      tasks: [projectArn],
    })
    const describeTasksRes = await ecs(c.env).send(describeTasksCommand)
    const tasks = describeTasksRes.tasks

    if (!tasks || tasks.length !== 1) {
      await KVProject(redis(c.env), input.id).remove()
      return c.json(r('INVALID_PROJECT_ID'))
    }
    const task = tasks[0]

    if (task.lastStatus === 'RUNNING') {
      if (!task.attachments || task.attachments.length === 0) {
        return c.json(r('INVALID_PROJECT_ID'))
      }

      if (!task.attachments[0].details) {
        return c.json(r('INVALID_PROJECT_ID'))
      }

      const eniId = task.attachments[0].details.find(
        (detail) => detail.name === 'networkInterfaceId'
      )?.value

      if (!eniId) {
        return c.json(r('INVALID_PROJECT_ID'))
      }

      const describeNetworkInterfacesCommand =
        new DescribeNetworkInterfacesCommand({
          NetworkInterfaceIds: [eniId],
        })

      const describeNetworkInterfacesRes = await ec2(c.env).send(
        describeNetworkInterfacesCommand
      )

      if (
        !describeNetworkInterfacesRes.NetworkInterfaces ||
        describeNetworkInterfacesRes.NetworkInterfaces.length === 0
      ) {
        return c.json(r('INVALID_PROJECT_ID'))
      }

      const publicIp =
        describeNetworkInterfacesRes.NetworkInterfaces[0].Association?.PublicIp
      if (!publicIp) {
        return c.json(r('INVALID_PROJECT_ID'))
      }

      return c.json(r('OK', { status: task.lastStatus, publicIp }))
    }

    return c.json(r('OK', { status: task.lastStatus }))
  }
)

const getAllProject = hAuth().get('/', async (c) => {
  const userId = c.get('x-userId')

  const dbProjects = await db(c.env)
    .select()
    .from(dbSchema.projects)
    .where(eq(dbSchema.projects.userId, userId))

  if (!dbProjects) {
    return c.json(r('OK', { projects: [] }))
  }

  const projects = dbProjects
    .map((project) => ({
      name: project.name,
      id: project.id,
    }))
    .reverse()

  return c.json(r('OK', { projects: projects }))
})

const deleteProject = hAuth().delete(
  '/:id',
  zValidator(
    'param',
    z.object({
      id: zReqString,
    })
  ),
  async (c) => {
    const input = c.req.valid('param')
    const userId = c.get('x-userId')

    if (!isValid(input.id)) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    const [res] = await db(c.env)
      .delete(dbSchema.projects)
      .where(
        and(
          eq(dbSchema.projects.id, input.id),
          eq(dbSchema.projects.userId, userId)
        )
      )
      .returning({
        id: dbSchema.projects.id,
      })

    if (!res) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    return c.json(r('OK'))
  }
)

const editProject = hAuth().post(
  '/:id',
  zValidator(
    'param',
    z.object({
      id: zReqString,
    })
  ),
  zValidator(
    'json',
    z.object({
      name: zReqString,
    })
  ),
  async (c) => {
    const projectId = c.req.valid('param').id
    const userId = c.get('x-userId')
    const input = c.req.valid('json')

    if (!isValid(projectId)) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    const [res] = await db(c.env)
      .update(dbSchema.projects)
      .set({
        name: input.name,
      })
      .where(
        and(
          eq(dbSchema.projects.id, projectId),
          eq(dbSchema.projects.userId, userId)
        )
      )
      .returning({
        id: dbSchema.projects.id,
      })

    if (!res) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    return c.json(r('OK'))
  }
)

export const projectRoute = h()
  .route('/', projectStatus)
  .route('/', deleteProject)
  .route('/', editProject)
  .route('/', createProject)
  .route('/', startProject)
  .route('/', getAllProject)
