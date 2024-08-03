import { app } from './route'
import { log } from './utils/log'

const server = Bun.serve({
  port: 5002,
  fetch: app.fetch,
})

log.info(`Server is running on ${server.port}`)
export type { AppType } from './route'
