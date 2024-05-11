import path from 'node:path'
import { serveStatic } from '@hono/node-server/serve-static'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

import { r } from '@coedit/r'

import { getPathContent, writePathContent } from '#/utils/fs'
import { h } from '#/utils/h'

const userPrefix = '/home/coedit'

const get = h().post(
  '/',
  zValidator(
    'json',
    z.object({
      include: z.string().array().nonempty(),
    })
  ),
  async (c) => {
    const input = c.req.valid('json')

    const result: {
      [key: string]:
        | {
            path: string
            name: string
            isDirectory: boolean
          }[]
        | 'ERROR'
    } = {}

    for (const path of input.include) {
      const fileRes = await getPathContent(path)
      if (fileRes.code === 'OK') {
        result[path] = fileRes.files
      } else {
        result[path] = 'ERROR'
      }
    }

    return c.json(r('OK', { result }))
  }
)

const updateFile = h().post(
  '/update',
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
    if (res.code !== 'OK') {
      return c.json(r('ERROR'))
    }
    return c.json(r('OK'))
  }
)

const content = h().use(
  '/workspace/*',
  serveStatic({
    root: path.relative(process.cwd(), userPrefix),
    rewriteRequestPath: (path: string) => path.replace(/^\/api/, ''),
    onNotFound: (path, c) => {
      console.log(`${path} is not found, request to ${c.req.path}`)
    },
  })
)

export const fileExplorerRoute = h()
  .route('/', updateFile)
  .route('/', get)
  .route('/', content)
