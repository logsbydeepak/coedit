import { websocket } from 'hono/bun'

import { app } from './route'
import { detectAndWarm } from './utils/environment'
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

// Kick off devbox + language server installation in the background, not
// gated on the user opening a terminal or a file.
void detectAndWarm()

export type { AppType } from './route'
export type { TerminalSendData, TerminalGetData } from '#/route/terminal'
