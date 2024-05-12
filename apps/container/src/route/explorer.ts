import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

import { r } from '@coedit/r'
import { zReqString } from '@coedit/zschema'

import { getPathContent } from '#/utils/fs'
import { h } from '#/utils/h'

const get = h().post(
  '/',
  zValidator(
    'json',
    z.object({
      path: zReqString,
    })
  ),
  async (c) => {
    const input = c.req.valid('json')
    const files = await getPathContent(input.path)

    if (files.code === 'ERROR') {
      return c.json(r('ERROR'))
    }

    return c.json(r('OK', { files: files.files }))
  }
)

export const explorerRoute = h().route('/', get)
