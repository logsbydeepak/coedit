import { APIServer } from './api'
import { ENV } from './env'
import { logger } from './utils/logger'
import { WSServer } from './ws'

const main = async () => {
  try {
    APIServer({ port: ENV.API_PORT })
    WSServer({
      port: ENV.WS_PORT,
    })
  } catch (error) {
    logger.error(error)
    process.exit(1)
  }
}

main()
