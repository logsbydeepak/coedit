import { readdir } from 'node:fs/promises'
import { join, relative } from 'path'
import { serveStatic } from '@hono/node-server/serve-static'
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'

import { r } from '@coedit/r'

const prefix = '/home/coedit/workspace'
const userPrefix = '/home/coedit'

export const api = new Hono()
  .post(
    '/fileExplorer',
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
        const fileRes = await fileExplorer(path)
        if (fileRes.code === 'OK') {
          result[path] = fileRes.files
        } else {
          result[path] = 'ERROR'
        }
      }

      return c.json(r('OK', { result }))
    }
  )
  .use(
    '/workspace/*',
    serveStatic({
      root: relative(process.cwd(), userPrefix),
      rewriteRequestPath: (path: string) => path.replace(/^\/api/, ''),
      onNotFound: (path, c) => {
        console.log(`${path} is not found, request to ${c.req.path}`)
      },
    })
  )

async function fileExplorer(path: string = '/') {
  try {
    if (path.includes('..')) return r('ERROR')

    const result: {
      path: string
      isDirectory: boolean
      name: string
    }[] = []

    const files = await readdir(join(prefix, path), { withFileTypes: true })

    for (const file of files) {
      result.push({
        name: file.name,
        isDirectory: file.isDirectory(),
        path: join(path, file.name),
      })
    }

    result.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) {
        return a.name.localeCompare(b.name)
      }

      return a.isDirectory ? -1 : 1
    })

    return r('OK', { files: result })
  } catch (error) {
    return r('ERROR')
  }
}
