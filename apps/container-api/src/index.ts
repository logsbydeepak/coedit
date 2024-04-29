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
}>()
  .post(
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

      const KVClient = KVProject(redis(c.env), input.id)

      const isExists = await KVClient.exists()
      if (!isExists) {
        return c.json(r('NOT_FOUND'))
      }

      const files = await getFiles(s3(c.env), {
        Bucket: c.env.AWS_BUCKET,
        key: `projects/${input.userId}/${input.id}`,
      })

      if (files.code !== 'OK') {
        throw new Error('Failed to get files')
      }

      return c.json(r('OK', { files: files.files }))
    }
  )
  .post(
    '/status',
    zValidator(
      'json',
      z.object({
        id: zReqString,
        userId: zReqString,
        status: z.enum(['INITIALIZING', 'RUNNING', 'STOP']),
      })
    ),
    async (c) => {
      const input = c.req.valid('json')
      const KVClient = KVProject(redis(c.env), input.id)

      const isExists = await KVClient.exists()
      if (!isExists) {
        return c.json(r('NOT_FOUND'))
      }

      if (input.status !== 'STOP') {
        await KVClient.update(input.status)
        return c.json(r('OK'))
      }

      await KVClient.remove()
      return c.json(r('OK'))
    }
  )

export type AppType = typeof app
export default app
