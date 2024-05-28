import { zValidator } from '@hono/zod-validator'
import { and, eq } from 'drizzle-orm'
import { generate } from 'random-words'
import { z } from 'zod'

import { db, dbSchema } from '@coedit/db'
import { genID, isValidID } from '@coedit/id'
import { KVdns } from '@coedit/kv-dns'
import { r } from '@coedit/r'
import { zReqString } from '@coedit/zschema'

import { ec2, ecs, redis } from '#/lib/config'
import {
  copySnapshotCommand,
  createSnapshotCommand,
  getLatestVolumeORSnapshot,
  getPublicIPCommand,
  getSnapshotCommand,
  waitUntilSnapshotAvailable,
  waitUntilVolumeAvailable,
} from '#/utils/ec2'
import { getTaskCommand, runTaskCommand } from '#/utils/ecs'
import { h, hAuth } from '#/utils/h'
import { KVProject } from '#/utils/project'

const createProject = hAuth().post(
  '/',
  zValidator('json', z.object({ templateId: zReqString, name: zReqString })),
  async (c) => {
    const userId = c.get('x-userId')
    const input = c.req.valid('json')

    if (!isValidID(input.templateId)) {
      return c.json(r('INVALID_TEMPLATE_ID'))
    }

    const [dbTemplate] = await db(c.env)
      .select()
      .from(dbSchema.templates)
      .where(eq(dbSchema.templates.id, input.templateId))

    if (!dbTemplate) {
      return c.json(r('INVALID_TEMPLATE_ID'))
    }

    const ec2Client = ec2(c.env)

    const templateSnapshot = await getSnapshotCommand(ec2Client, {
      templateTagId: input.templateId,
    })

    if (templateSnapshot.code === 'NOT_FOUND') {
      return c.json(r('INVALID_TEMPLATE_ID'))
    }

    const templateSnapshotId = templateSnapshot.data.SnapshotId
    if (!templateSnapshotId) {
      return c.json(r('INVALID_TEMPLATE_ID'))
    }

    const newProjectId = genID()
    const copySnapshot = await copySnapshotCommand(ec2Client, c.env, {
      sourceSnapshotId: templateSnapshotId,
      projectTagId: newProjectId,
    })

    if (copySnapshot.code === 'NOT_CREATED') {
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

    if (!isValidID(input.id)) {
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

    if (c.env.CONTAINER_MODE === 'mock') {
      return c.json(
        r('OK', {
          status: 'RUNNING',
        })
      )
    }

    const ecsClient = ecs(c.env)
    const ec2Client = ec2(c.env)

    const projectArn = await KVProject(redis(c.env), input.id).get()

    if (projectArn) {
      const task = await getTaskCommand(ecsClient, { projectId: projectArn })

      if (task.code === 'NOT_FOUND') {
        await KVProject(redis(c.env), input.id).remove()
        return c.json(r('INVALID_PROJECT_ID'))
      }

      if (task.data.desiredStatus === 'RUNNING') {
        return c.json(r('OK'))
      }
    }

    let snapshotId = ''

    const latestVolumeORSnapshot = await getLatestVolumeORSnapshot(ec2Client, {
      projectTagId: input.id,
    })

    if (latestVolumeORSnapshot.code === 'NOT_FOUND') {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    if (latestVolumeORSnapshot.data.type === 'snapshot') {
      snapshotId = latestVolumeORSnapshot.data.id
    }

    if (latestVolumeORSnapshot.data.type === 'volume') {
      const volumeId = latestVolumeORSnapshot.data.id

      const waitVolume = await waitUntilVolumeAvailable(ec2Client, {
        volumeId,
      })

      if (waitVolume.code === 'TIMEOUT') {
        return c.json(r('TIMEOUT'))
      }

      const snapshot = await createSnapshotCommand(ec2Client, {
        projectTagId: input.id,
        volumeId,
      })

      if (snapshot.code === 'INVALID_PROJECT_ID') {
        return c.json(r('INVALID_PROJECT_ID'))
      }
      if (!snapshot.data.SnapshotId) {
        return c.json(r('INVALID_PROJECT_ID'))
      }

      snapshotId = snapshot.data.SnapshotId
    }

    if (!snapshotId) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    const waitSnapshot = await waitUntilSnapshotAvailable(ec2Client, {
      snapshotId: snapshotId,
    })
    if (waitSnapshot.code === 'TIMEOUT') {
      return c.json(r('TIMEOUT'))
    }

    const task = await runTaskCommand(ecsClient, c.env, {
      snapshotId,
      projectTagId: input.id,
    })
    if (task.code === 'NOT_CREATED') {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    const taskArn = task.data.taskArn
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

    if (!isValidID(input.id)) {
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

    if (c.env.CONTAINER_MODE === 'mock') {
      return c.json(
        r('OK', {
          api: 'http://localhost:4000',
          output: 'http://localhost:3000',
        })
      )
    }

    const projectArn = await KVProject(redis(c.env), input.id).get()
    if (!projectArn) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    const ecsClient = ecs(c.env)
    const task = await getTaskCommand(ecsClient, { projectId: projectArn })

    if (task.code === 'NOT_FOUND') {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    if (task.data.lastStatus === 'RUNNING') {
      if (
        !task.data.attachments ||
        task.data.attachments.length === 0 ||
        !task.data.attachments[0].details
      ) {
        return c.json(r('INVALID_PROJECT_ID'))
      }

      const networkInterface = task.data.attachments.find(
        (attachment) => attachment.type === 'ElasticNetworkInterface'
      )

      if (!networkInterface || !networkInterface.details) {
        return c.json(r('INVALID_PROJECT_ID'))
      }

      const eniId = networkInterface?.details.find(
        (detail) => detail.name === 'networkInterfaceId'
      )?.value

      if (!eniId) {
        return c.json(r('INVALID_PROJECT_ID'))
      }
      const ec2Client = ec2(c.env)

      const publicIP = await getPublicIPCommand(ec2Client, { eniId })

      if (publicIP.code === 'NOT_FOUND') {
        return c.json(r('INVALID_PROJECT_ID'))
      }

      const dnsRedisClient = redis({
        APP_UPSTASH_REDIS_REST_URL: c.env.DNS_UPSTASH_REDIS_REST_URL,
        APP_UPSTASH_REDIS_REST_TOKEN: c.env.DNS_UPSTASH_REDIS_REST_TOKEN,
      })

      const IP = publicIP.data.IP
      const subdomain = await generateSubdomain(async (subdomain) => {
        const KVClient = KVdns(dnsRedisClient, subdomain)
        return await KVClient.exists()
      })

      const KVClient = KVdns(dnsRedisClient, subdomain)
      await KVClient.set(IP)

      return c.json(
        r('OK', {
          api: `https://${subdomain}-server${c.env.DNS_ROOT_DOMAIN}`,
          output: `https://${subdomain}-app${c.env.DNS_ROOT_DOMAIN}`,
        })
      )
    }

    if (!task.data.lastStatus) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    return c.json(r('STATUS', { status: task.data.lastStatus }))
  }
)

async function generateSubdomain(
  isExist: (subdomain: string) => Promise<boolean>
) {
  while (true) {
    const subdomain = generate({
      exactly: 1,
      wordsPerString: 2,
      separator: '-',
    })[0].toLowerCase()

    if (subdomain.includes('-app') || subdomain.includes('-server')) {
      continue
    }

    const isExistSubdomain = await isExist(subdomain)

    if (!isExistSubdomain) {
      return subdomain
    }
  }
}

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

    if (!isValidID(input.id)) {
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

    if (!isValidID(projectId)) {
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
