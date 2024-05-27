import { websocket } from '#/utils/ws'

import { app } from './route'
import { handleStopEvent, startTimeout } from './utils/lifecycle'
import { logger } from './utils/logger'

const server = Bun.serve({
  port: 8000,
  fetch: app.fetch,
  websocket,
})

logger.info(`Server is running on ${server.port}`)
handleStopEvent()
startTimeout()

export type { AppType } from './route'
export type { TerminalSendData, TerminalGetData } from '#/route/terminal'
