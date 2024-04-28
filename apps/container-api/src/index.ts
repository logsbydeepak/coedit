import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

import { KVProject } from '@coedit/kv-project'
import { r } from '@coedit/r'
import { zReqString } from '@coedit/zschema'

import { ENV } from './utils/h'
import { redis, s3 } from './utils/lib'
import { getFiles } from './utils/s3'

const app = new Hono<{
  Bindings: ENV
}>().post(
  '/files',
  zValidator(
    'json',
    z.object({
      id: zReqString,
      userId: zReqString,
    })
  ),
  async (c) => {
    const input = c.req.valid('json')

    const update = await KVProject(redis(c.env), input.id).update(
      'INITIALIZING'
    )

    const files = await getFiles(s3(c.env), {
      Bucket: c.env.AWS_BUCKET,
      key: `projects/${input.userId}/${input.id}`,
    })

    if (files.code !== 'OK') {
      throw new Error('Failed to get files')
    }

    if (!update) {
      return c.json(r('PROJECT_NOT_FOUND'))
    }

    return c.json(r('OK', { files: files.files }))
  }
)

export default app
