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
    const term = spawn('bash', [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: process.env.HOME,
      env: process.env,
    })

    term.onData((data) => {
      ws.send(data)
    })

    ws.on('message', (message: string) => {
      term.write(message)
    })

    ws.on('close', () => {
      term.kill()
    })
  })
}
