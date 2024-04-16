import { serve } from '@hono/node-server'
import { Hono } from 'hono'

import { logger } from './utils/logger'

export const APIServer = ({ port }: { port: number }) => {
  const app = new Hono()

  app.get('/', (c) => c.text('Hello Node.js!'))

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
