import { serve } from '@hono/node-server'
import { Hono } from 'hono'

import { env } from '#/env'

import { api } from './api'
import { logger } from './utils/logger'

const app = new Hono().route('/api', api)

export const server = serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    logger.info(
      {
        api: '/api',
        ws: '/ws',
      },
      `Server is running on ${info.port}`
    )
  }
)

server.on('error', (err) => {
  logger.error(err)
  process.exit(1)
})
