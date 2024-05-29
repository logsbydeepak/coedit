import { EventEmitter } from 'node:events'
import ms from 'ms'

import { logger } from './logger'

const event = new EventEmitter()

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
    await wait(ms('5s'))
    process.exit(0)
  })
}

let timeout: Timer

export function startTimeout() {
  timeout = setTimeout(() => {
    logger.info('Server is inactive')
    emitStop()
  }, ms('5m'))
}

export function setActive() {
  clearTimeout(timeout)
  startTimeout()
}
