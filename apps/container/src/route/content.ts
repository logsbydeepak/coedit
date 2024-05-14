import path from 'node:path'
import { serveStatic } from '@hono/node-server/serve-static'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

import { r } from '@coedit/r'

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
    'json',
    z.object({
      path: z.string(),
      body: z.string(),
    })
  ),
  async (c) => {
    const input = c.req.valid('json')
    const res = await writePathContent(input.path, input.body)

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
