import { CopyObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { zValidator } from '@hono/zod-validator'

import { r, tryCatch } from '@coedit/r'
import { z, zReqString } from '@coedit/zschema'

import { env } from '#/env'
import { s3Client } from '#/utils/config'
import { h } from '#/utils/h'
import { log } from '#/utils/log'

const zSchema = z.object({
  userId: zReqString,
  templateId: zReqString,
  projectId: zReqString,
})

export const createProject = h().post(
  '/',
  zValidator('json', zSchema),
  async (c) => {
    const input = c.req.valid('json')

    const s3 = s3Client()
    const copySource = `/templates/${input.templateId}/`
    const destinationKey = `projects/${input.userId}/${input.projectId}/`

    const headCommand = new HeadObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: copySource,
    })
    const headResponse = await tryCatch(s3.send(headCommand))
    if (headResponse.error) {
      log.error({ error: headResponse.error }, 'Template does not exist in S3')
      return c.json(r('INVALID_TEMPLATE_ID'))
    }

    const copyCommand = new CopyObjectCommand({
      Bucket: env.S3_BUCKET,
      CopySource: copySource,
      Key: destinationKey,
    })

    const copyResponse = await tryCatch(s3.send(copyCommand))
    if (copyResponse.error) {
      log.error({ error: copyResponse.error }, 'Error copying template in S3')
      return c.json(r('ERROR'))
    }

    return c.json(r('OK'))
  }
)
