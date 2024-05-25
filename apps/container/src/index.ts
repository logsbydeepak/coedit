import { websocket } from '#/utils/ws'

import { env } from './env'
import { app } from './route'
import { handleStopEvent, startTimeout } from './utils/lifecycle'
import { logger } from './utils/logger'

const server = Bun.serve(
  env.RUNTIME === 'development'
    ? {
        fetch: app.fetch,
        port: 80,
      }
    : {
        fetch: app.fetch,
        port: 443,
        cert: Bun.file('/root/coedit/apps/container/certificate/fullchain.pem'),
        key: Bun.file('/root/coedit/apps/container/certificate/key.pem'),
        websocket,
      }
)

logger.info(`Server is running on ${server.port}`)
handleStopEvent()
startTimeout()

export type { AppType } from './route'
export type { TerminalSendData, TerminalGetData } from '#/route/terminal'
