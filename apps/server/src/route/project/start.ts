import { zValidator } from '@hono/zod-validator'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db, dbSchema } from '@coedit/db'
import { isValidID } from '@coedit/id'
import { r } from '@coedit/r'
import { zReqString } from '@coedit/zschema'

import { ec2, ecs, redis } from '#/utils/config'
import {
  createSnapshotCommand,
  getLatestVolumeORSnapshot,
  waitUntilSnapshotAvailable,
  waitUntilVolumeAvailable,
} from '#/utils/ec2'
import { getTaskCommand, runTaskCommand } from '#/utils/ecs'
import { hAuth } from '#/utils/h'
import { KVProject } from '#/utils/project'

export const startProject = hAuth().post(
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
