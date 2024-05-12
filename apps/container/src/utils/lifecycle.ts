import { EventEmitter } from 'node:events'
import ms from 'ms'

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
    await wait(1000)
    process.exit(0)
  })
}

let timeout: Timer
function resetTimeout() {
  clearTimeout(timeout)
}

function startTimeout() {
  timeout = setTimeout(() => {
    logger.info('Server is inactive')
    emitStop()
  }, ms('5m'))
}

export function handleInactive() {
  startTimeout()
  event.addListener('active', () => {
    resetTimeout()
    startTimeout()
  })
}

let throttledTimeout: Timer | undefined
function throttled(func: Function, wait: number) {
  return function (this: any, ...args: any[]) {
    const context = this
    if (!throttledTimeout) {
      func.apply(context, args)
      throttledTimeout = setTimeout(() => {
        throttledTimeout = undefined
      }, wait)
    }
  }
}

const throttleSetActive = throttled(() => {
  event.emit('active')
}, ms('3m'))

export function setActive() {
  throttleSetActive()
}
