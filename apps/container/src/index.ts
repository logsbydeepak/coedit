import { spawn } from 'node-pty'
import { WebSocket } from 'ws'

const wss = new WebSocket.Server({ port: 3001 })

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
