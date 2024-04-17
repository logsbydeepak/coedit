import { RunTaskCommand } from '@aws-sdk/client-ecs'
import {
  CopyObjectCommand,
  CopyObjectOutput,
  ListObjectsV2Command,
  type S3Client,
} from '@aws-sdk/client-s3'
import { zValidator } from '@hono/zod-validator'
import { and, eq } from 'drizzle-orm'
import { isValid, ulid } from 'ulidx'
import { z } from 'zod'

import { r } from '@coedit/r'
import { zReqString } from '@coedit/zschema'

import { db, dbSchema } from '#/db'
import { ecs, s3 } from '#/lib/config'
import { h, hAuth } from '#/utils/h'

const create = hAuth().post(
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

    const newProjectId = ulid()

    const res = await copyFolder({
      s3: s3(c.env),
      Bucket: c.env.AWS_BUCKET,
      from: `templates/${input.templateId}`,
      to: `projects/${userId}/${newProjectId}`,
    })

    if (res.code !== 'OK') {
      throw new Error('Failed to copy template')
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

async function copyFolder({
  Bucket: Bucket,
  from: from,
  to: to,
  s3,
}: {
  Bucket: string
  from: string
  to: string
  s3: S3Client
}) {
  try {
    const recursiveCopy = async function (token?: string) {
      const listCommand = new ListObjectsV2Command({
        Bucket: Bucket,
        Prefix: from,
        ContinuationToken: token,
      })
      const list = await s3.send(listCommand)

      const copyPromises: Promise<CopyObjectOutput>[] = []
      if (list.KeyCount && list.Contents) {
        const fromObjectKeys = list.Contents.map((content) => content.Key)

        for (let fromObjectKey of fromObjectKeys) {
          if (!fromObjectKey) continue

          const toObjectKey = fromObjectKey.replace(from, to)

          const copyCommand = new CopyObjectCommand({
            Bucket: Bucket,
            CopySource: `${Bucket}/${fromObjectKey}`,
            Key: toObjectKey,
          })
          copyPromises.push(s3.send(copyCommand))
          await s3.send(copyCommand)
        }
      }

      await Promise.all(copyPromises)
      if (list.NextContinuationToken) {
        recursiveCopy(list.NextContinuationToken)
      }
      return r('OK')
    }
    return recursiveCopy()
  } catch (error) {
    return r('ERROR')
  }
}

const startProject = hAuth().post(
  '/start',
  zValidator('json', z.object({ projectId: zReqString })),
  async (c) => {
    const userId = c.get('x-userId')
    const input = c.req.valid('json')

    if (!isValid(input.projectId)) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    const [dbProject] = await db(c.env)
      .select()
      .from(dbSchema.projects)
      .where(
        and(
          eq(dbSchema.projects.id, input.projectId),
          eq(dbSchema.projects.userId, userId)
        )
      )

    if (!dbProject) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    return c.json(r('OK'))
  }
)

export const projectRoute = h().route('/', create).route('/', startProject)
