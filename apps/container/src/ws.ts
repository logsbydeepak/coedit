import { Server as HttpServer } from 'http'
import { spawn } from 'node-pty'
import { WebSocket, WebSocketServer } from 'ws'

import { server } from './server'
import { logger } from './utils/logger'

const ws = new WebSocketServer({
  path: '/ws',
  server: server as HttpServer,
})

ws.on('error', (err) => {
  logger.error(err)
})

ws.on('connection', (ws: WebSocket) => {
  const USER = 'coedit'
  const WORKSPACE = `/home/${USER}/workspace`

  // const term = spawn(
  //   'su',
  //   [USER, '--login', '--pty', '-c', `cd ${WORKSPACE}; bash`],
  //   {}
  // )
  const term = spawn('bash', [], {})

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
