import path from 'node:path'
import { zValidator } from '@hono/zod-validator'
import { serveStatic } from 'hono/bun'

import { r } from '@coedit/r'
import { z } from '@coedit/zschema'

import { writePathContent } from '#/utils/fs'
import { h } from '#/utils/h'

const userPrefix = '/home/coedit'

const get = h().get(
  '*',
  serveStatic({
    root: path.relative(process.cwd(), userPrefix),
    rewriteRequestPath: (path: string) => {
      const newPath = path
        .replace(/^\/api/, '')
        .replace(/^\/content/, 'workspace')
      return newPath
    },
    onNotFound: (path, c) => {
      console.log(`${path} is not found, request to ${c.req.path}`)
    },
  })
)

const update = h().post(
  '/',
  zValidator(
    'query',
    z.object({
      path: z.string(),
    })
  ),
  async (c) => {
    const input = c.req.valid('query')
    const content = await c.req.text()

    const res = await writePathContent(input.path, content)

    if (res.code === 'INVALID_PATH') {
      return c.json(r('INVALID_PATH'))
    }

    if (res.code !== 'OK') {
      return c.json(r('ERROR'))
    }
    return c.json(r('OK'))
  }
)

export const contentRoute = h().route('/', get).route('/', update)
