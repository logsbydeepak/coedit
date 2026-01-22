import { CopyObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { zValidator } from '@hono/zod-validator'

import { db, dbSchema, eq } from '@coedit/db'
import { genID, isValidID } from '@coedit/id'
import { r, tryCatch } from '@coedit/r'
import { zCreateProject } from '@coedit/zschema'

import { s3Client } from '#/utils/config'
import { hAuth } from '#/utils/h'
import { log } from '#/utils/log'

export const createProject = hAuth().post(
  '/',
  zValidator('json', zCreateProject),
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

    const id = genID()
    const copySource = `/templates/${input.templateId}/`
    const destinationKey = `projects/${userId}/${id}/`

    const s3 = s3Client(c.env)
    const headCommand = new HeadObjectCommand({
      Bucket: c.env.S3_BUCKET,
      Key: copySource,
    })
    const headResponse = await tryCatch(s3.send(headCommand))
    if (headResponse.error) {
      log.error({ error: headResponse.error }, 'Template does not exist in S3')
      return c.json(r('INVALID_TEMPLATE_ID'))
    }

    const copyCommand = new CopyObjectCommand({
      Bucket: c.env.S3_BUCKET,
      CopySource: copySource,
      Key: destinationKey,
    })

    const copyResponse = await tryCatch(s3.send(copyCommand))
    if (copyResponse.error) {
      log.error({ error: copyResponse.error }, 'Error copying template in S3')
      return c.json(r('ERROR'))
    }

    await db(c.env).insert(dbSchema.projects).values({
      id: id,
      userId: userId,
      name: input.name,
    })

    return c.json(
      r('OK', {
        projectId: id,
      })
    )
  }
)
