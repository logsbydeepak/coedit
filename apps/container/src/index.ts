import { APIServer } from './api'
import { containerClient } from './api-client'
import { ENV } from './env'
import { init } from './init'
import { logger } from './utils/logger'
import { WSServer } from './ws'

const main = async () => {
  try {
    await init()
    APIServer({ port: ENV.API_PORT })
    WSServer({
      port: ENV.WS_PORT,
    })
  } catch (error) {
    await containerClient.status.$post({
      json: {
        id: ENV.CONTAINER_ID,
        userId: ENV.USER_ID,
        status: 'STOP',
      },
    })

    logger.error(error)
    process.exit(1)
  }
}

main()
