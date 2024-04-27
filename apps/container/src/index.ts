import { APIServer } from './api'
import { ENV } from './env'
import { logger } from './utils/logger'
import { WSServer } from './ws'

const main = () => {
  try {
    APIServer({ port: ENV.API_PORT })
    WSServer({
      port: ENV.WS_PORT,
    })
  } catch (error) {
    logger.error(error)
  }
}

main()
