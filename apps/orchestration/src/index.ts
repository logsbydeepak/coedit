import { app } from './route'
import { teardownAllProjects } from './route/project/lifecycle'
import { log } from './utils/log'

const server = Bun.serve({
  port: 5002,
  fetch: app.fetch,
})

log.info(`Server is running on ${server.port}`)

let shuttingDown = false

async function shutdown(signal: string) {
  // Guard against a second signal (e.g. SIGINT then SIGTERM) re-entering.
  if (shuttingDown) return
  shuttingDown = true

  const logger = log.child({ proc: 'shutdown', signal })
  logger.info('SHUTDOWN_BEGIN')

  // Stop accepting new requests, then tear down every project container so we
  // don't leak containers, loop mounts, or DNS records on exit.
  await server.stop(true)
  await teardownAllProjects(logger)

  logger.info('SHUTDOWN_DONE')
  process.exit(0)
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

export type { AppType } from './route'
