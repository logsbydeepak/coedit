import { pino, type LoggerOptions } from 'pino'

const pinoOptions: LoggerOptions = {}

export const logger = pino(pinoOptions)
