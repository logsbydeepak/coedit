import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'

import { env } from '#/env'

import { api } from './api'
import { logger } from './utils/logger'

const app = new Hono()
  .use(
    cors({
      origin: ['http://localhost:3000'],
      credentials: true,
    })
  )
  .use(secureHeaders())
  .route('/api', api)

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

export type AppType = typeof app
