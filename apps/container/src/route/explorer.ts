import { zValidator } from '@hono/zod-validator'

import { r } from '@coedit/r'
import { z, zReqString } from '@coedit/zschema'

import { getPathContent, listAllPaths, searchFiles } from '#/utils/fs'
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

const search = h().get(
  '/search',
  zValidator(
    'query',
    z.object({
      query: z.string().optional(),
    }),
    (result, c) => {
      if (!result.success) return c.json(r('ERROR'), 400)
    }
  ),
  async (c) => {
    const input = c.req.valid('query')
    const files = await searchFiles(input.query ?? '')

    if (files.code === 'ERROR') {
      return c.json(r('ERROR'))
    }

    return c.json(r('OK', { files: files.files }))
  }
)

const tree = h().get('/tree', async (c) => {
  const result = await listAllPaths()

  if (result.code === 'ERROR') {
    return c.json(r('ERROR'))
  }

  return c.json(r('OK', { paths: result.paths }))
})

export const explorerRoute = h()
  .route('/', get)
  .route('/', search)
  .route('/', tree)
