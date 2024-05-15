import { Server as HttpServer } from 'http'
import { EventEmitter } from 'node:events'
import { serve } from '@hono/node-server'

import { app } from './api'
import { env } from './env'
import { emitStop, handleStopEvent, startTimeout } from './utils/lifecycle'
import { logger } from './utils/logger'
import { ws } from './ws'

export const event = new EventEmitter()

export type { AppType } from './api'
export type { WSGetData, WSSendData } from './ws'

async function main() {
  try {
    const server = serve(
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

    ws(server as HttpServer)

    server.on('error', (err) => {
      logger.error(err, 'Server error')
      emitStop()
    })
  } catch (error) {
    logger.error(error, 'Something went wrong')
    emitStop()
  }
}

handleStopEvent()
startTimeout()

main()
