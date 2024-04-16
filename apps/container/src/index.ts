import { APIServer } from './api'
import { logger } from './utils/logger'
import { WSServer } from './ws'

const main = () => {
  try {
    const API_PORT = Number(process.env.API_PORT)
    const WS_PORT = Number(process.env.WS_PORT)

    APIServer({ port: API_PORT })

    WSServer({
      port: WS_PORT,
    })
  } catch (error) {
    logger.error(error)
  }
}

main()
