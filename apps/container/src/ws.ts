import { spawn } from 'node-pty'
import { WebSocket, WebSocketServer } from 'ws'

import { logger } from './utils/logger'

export const WSServer = ({ port }: { port: number }) => {
  const wss = new WebSocketServer(
    {
      port,
    },
    () => {
      logger.info(`WebSocket server is running on ${port}`)
    }
  )

  wss.on('error', (err) => {
    logger.error(err)
  })

  wss.on('connection', (ws: WebSocket) => {
    const NEW_USER = process.env.NEW_USER
    const PWD = process.env.PWD
    if (!NEW_USER) {
      logger.error('env NEW_USER missing')
      process.exit(1)
    }
    if (!PWD) {
      logger.error('env PWD missing')
      process.exit(1)
    }

    const term = spawn(
      'su',
      [NEW_USER, '--login', '--pty', '-c', `cd ${PWD}; bash`],
      {}
    )

    term.onData((data) => {
      ws.send(data)
    })

    term.onExit(() => {
      ws.close()
    })

    ws.on('message', (message: string) => {
      try {
        const data:
          | { type: 'input'; data: string }
          | {
              type: 'resize'
              data: {
                cols: number
                rows: number
              }
            } = JSON.parse(message)
        if (!data) return
        if (!data?.type) return

        if (data.type === 'input' && data.data) {
          if (!data.data) return
          term.write(data.data)
          return
        }

        if (data.type === 'resize') {
          if (!data.data.cols) return
          if (!data.data.rows) return
          term.resize(data.data.cols, data.data.rows)
          return
        }
        term.write(message)
      } catch (error) {
        logger.error(error)
      }
    })

    ws.on('resize', (text) => {
      console.log(text)
    })

    ws.on('close', () => {
      term.kill()
    })
  })
}
