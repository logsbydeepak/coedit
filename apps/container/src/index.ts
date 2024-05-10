import { serve } from '@hono/node-server'

import { app } from './api'
import { env } from './env'
import { logger } from './utils/logger'
import { ws } from './ws'

export type { AppType } from './api'
export type { WSGetData, WSSendData } from './ws'

export async function main() {
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

    ws(server)

    server.on('error', (err) => {
      logger.error(err)
      process.exit(1)
    })
  } catch (error) {
    logger.error(error)
    process.exit(1)
  }
}

main()
