import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'

import { logger } from './utils/logger'

export const APIServer = ({ port }: { port: number }) => {
  const app = new Hono()
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

  serve(
    {
      fetch: app.fetch,
      port,
    },
    (info) => {
      logger.info(`API server is running on ${info.port}`)
    }
  )
}
