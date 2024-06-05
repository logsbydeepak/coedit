import { websocket } from '#/utils/ws'

import { app } from './route'
import { handleStopEvent, startTimeout } from './utils/lifecycle'
import { log } from './utils/log'

const server = Bun.serve({
  port: 8000,
  fetch: app.fetch,
  websocket,
})

log.info(`Server is running on ${server.port}`)
handleStopEvent()
startTimeout()

export type { AppType } from './route'
export type { TerminalSendData, TerminalGetData } from '#/route/terminal'
