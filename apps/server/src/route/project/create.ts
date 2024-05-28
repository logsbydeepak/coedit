import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { db, dbSchema } from '@coedit/db'
import { genID, isValidID } from '@coedit/id'
import { r } from '@coedit/r'
import { zReqString } from '@coedit/zschema'

import { ec2 } from '#/utils/config'
import { copySnapshotCommand, getSnapshotCommand } from '#/utils/ec2'
import { hAuth } from '#/utils/h'

export const createProject = hAuth().post(
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
