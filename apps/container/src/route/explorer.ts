import { zValidator } from '@hono/zod-validator'

import { r } from '@coedit/r'
import { z, zReqString } from '@coedit/zschema'

import { getPathContent } from '#/utils/fs'
import { h } from '#/utils/h'

const get = h().get(
  '/',
  zValidator(
    'query',
    z.object({
      path: zReqString,
    }),
    (result, c) => {
      if (!result.success) return c.json(r('ERROR'), 400)
    }
  ),
  async (c) => {
    const input = c.req.valid('query')
    const files = await getPathContent(input.path)

    if (files.code === 'ERROR') {
      return c.json(r('ERROR'))
    }

    return c.json(r('OK', { files: files.files }))
  }
)

export const explorerRoute = h().route('/', get)
