import { EventEmitter } from 'node:events'

import { logger } from './logger'

export const event = new EventEmitter()

export function emitStop() {
  event.emit('stop')
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function handleStopEvent() {
  event.on('stop', async () => {
    logger.info('Server is stopping')
    await wait(4000)
    process.exit(0)
  })
}
