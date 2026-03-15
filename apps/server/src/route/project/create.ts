import { CopyObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { zValidator } from '@hono/zod-validator'
import { DOMParser } from '@xmldom/xmldom'

import { db, dbSchema, eq } from '@coedit/db'
import { genID, isValidID } from '@coedit/id'
import { r, tryCatch } from '@coedit/r'
import { zCreateProject } from '@coedit/zschema'

import { s3Client } from '#/utils/config'
import { hAuth } from '#/utils/h'
import { log } from '#/utils/log'

globalThis.DOMParser = DOMParser
globalThis.Node = {
  ELEMENT_NODE: 1,
  ATTRIBUTE_NODE: 2,
  TEXT_NODE: 3,
  CDATA_SECTION_NODE: 4,
  COMMENT_NODE: 8,
  DOCUMENT_NODE: 9,
} as any

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

    const s3 = s3Client(c.env)

    const headCommand = new HeadObjectCommand({
      Bucket: c.env.S3_BUCKET,
      Key: `templates/${input.templateId}.img.zst`,
    })

    const headResponse = await tryCatch(s3.send(headCommand))
    if (headResponse.error) {
      log.error({ error: headResponse.error }, 'Template does not exist in S3')
      return c.json(r('INVALID_TEMPLATE_ID'))
    }

    const copySource = `${c.env.S3_BUCKET}/templates/${input.templateId}.img.zst`
    const destinationKey = `projects/${userId}/${id}.img.zst`
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
      status: 'IDLE',
    })

    return c.json(
      r('OK', {
        projectId: id,
      })
    )
  }
)
