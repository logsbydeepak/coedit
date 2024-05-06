import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'

export const api = new Hono()
  .get(
    '/static/*',
    serveStatic({
      root: '.',
      rewriteRequestPath: (path: string) => path.replace(/^\/static/, ''),
      onNotFound: (path, c) => {
        console.log(`${path} is not found, request to ${c.req.path}`)
      },
    })
  )
  .get('/', (c) => c.text('Hello Node.js!'))
