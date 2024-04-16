import { pino, type LoggerOptions } from 'pino'

const pinoOptions: LoggerOptions = {}
if (process.stdout.isTTY) {
  pinoOptions.transport = {
    target: 'pino-pretty',
  }
}

export const logger = pino(pinoOptions)
