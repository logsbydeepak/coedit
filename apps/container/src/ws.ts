import { Server as HttpServer } from 'http'
import cookies from 'cookie'
import { IPty, spawn } from 'node-pty'
import { ulid } from 'ulidx'
import { WebSocket, WebSocketServer } from 'ws'

import { apiClient } from './utils/api-client'
import { emitStop } from './utils/lifecycle'
import { logger } from './utils/logger'

export const ws = (server: HttpServer) => {
  const wss = new WebSocketServer({
    path: '/ws',
    clientTracking: false,
    noServer: true,
  })

  wss.on('error', (err) => {
    logger.error(err)
  })

  server.on('upgrade', async (req, socket, head) => {
    const cookie = cookies.parse(req.headers.cookie || '')
    const token = cookie['x-auth']

    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      emitStop()
      return
    }

    const res = await apiClient(token).user.isAuth.$get()
    const resData = await res.json()

    if (resData.code !== 'OK') {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      emitStop()
      return
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req)
    })
  })

  wss.on('connection', (ws: WebSocket) => {
    const termGroup = new Map<string, IPty>()

    ws.on('message', (message) => {
      const data = getData(message as Uint8Array)

      if (data.event === 'add') {
        const id = ulid()
        const term = createTerm()

        term.onData((data) => {
          ws.send(sendData({ event: 'term', data: { id, data } }))
        })

        termGroup.set(id, term)
        ws.send(sendData({ event: 'add', data: id }))
      }

      if (data.event === 'remove') {
        const id = data.data
        const term = termGroup.get(id)
        if (!term) return
        killTerm(term)
        termGroup.delete(id)
        ws.send(sendData({ event: 'remove', data: id }))
      }

      if (data.event === 'resize') {
        const id = data.data.id
        const term = termGroup.get(id)
        if (!term) return
        term.resize(data.data.cols, data.data.rows)
      }

      if (data.event === 'term') {
        const id = data.data.id
        const term = termGroup.get(id)
        if (!term) return
        term.write(data.data.data)
      }
    })

    ws.on('close', () => {
      for (const term of termGroup.values()) {
        killTerm(term)
      }
    })

    ws.on('error', (err) => {
      logger.error(err)

      for (const term of termGroup.values()) {
        killTerm(term)
      }
    })
  })
}

function createTerm() {
  const USER = 'coedit'
  const WORKSPACE = `/home/${USER}/workspace`

  return spawn(
    'su',
    [USER, '--login', '--pty', '-c', `cd ${WORKSPACE}; bash`],
    {}
  )
}

function killTerm(term: IPty) {
  try {
    const pid = term.pid
    term.kill()
    process.kill(pid)
  } catch (error) {
    logger.error('error while killing term')
  }
}

function sendData(
  data:
    | {
      event: 'term'
      data: {
        id: string
        data: string
      }
    }
    | {
      event: 'add' | 'remove'
      data: string
    }
) {
  return JSON.stringify(data)
}

function getData(data: Uint8Array) {
  return JSON.parse(new TextDecoder().decode(data)) as
    | {
      event: 'term'
      data: {
        id: string
        data: string
      }
    }
    | {
      event: 'resize'
      data: { cols: number; rows: number; id: string }
    }
    | {
      event: 'add'
      data: undefined
    }
    | {
      event: 'remove'
      data: string
    }
}

export type WSGetData = ReturnType<typeof getData>
export type WSSendData = Parameters<typeof sendData>[0]
