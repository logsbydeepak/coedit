import {
  CopySnapshotCommand,
  DescribeSnapshotsCommand,
} from '@aws-sdk/client-ec2'
import { zValidator } from '@hono/zod-validator'
import { and, eq } from 'drizzle-orm'
import { isValid, ulid } from 'ulidx'
import { z } from 'zod'

import { db, dbSchema } from '@coedit/db'
import { r } from '@coedit/r'
import { zReqString } from '@coedit/zschema'

import { ec2, redis } from '#/lib/config'
import { h, hAuth } from '#/utils/h'
import { KVProject } from '#/utils/project'

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

    const isExists = await KVProject(redis(c.env), input.id).exists()
    if (isExists) {
      return c.json(r('PROJECT_ALREADY_STARTED'))
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

    await KVProject(redis(c.env), input.id).set('STARTING', 'http:127.0.0.1')

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

    if (!isValid(input.id)) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    const KVProjectClient = KVProject(redis(c.env), input.id)

    const data = await KVProjectClient.get()
    if (!data) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    return c.json(
      r('OK', {
        status: data.status,
        url: data.url,
      })
    )
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
