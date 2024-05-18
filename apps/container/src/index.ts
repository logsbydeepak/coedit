import { websocket } from '#/utils/ws'

import { env } from './env'
import { app } from './route'
import { handleStopEvent, startTimeout } from './utils/lifecycle'
import { logger } from './utils/logger'

const server = Bun.serve({
  fetch: app.fetch,
  port: env.PORT,
  websocket,
})

logger.info(`Server is running on ${server.url}`)
handleStopEvent()
startTimeout()

export type { AppType } from './route'
export type { TerminalSendData, TerminalGetData } from '#/route/terminal'
