import { Pty } from '@replit/ruspty'
import { WSContext } from 'hono/ws'

import { genID } from '@coedit/id'

import { h } from '#/utils/h'
import { setActive } from '#/utils/lifecycle'
import { log } from '#/utils/log'
import { upgradeWebSocket } from '#/utils/ws'

const terminal = h().get(
  '/',
  upgradeWebSocket(() => {
    const termGroup = new Map<string, Pty>()

    return {
      onMessage: (rawData, ws) => {
        const data = getData(rawData.data.toString())

        if (data.event === 'add') {
          const id = genID()
          const term = createTerm({
            id,
            ws,
            onExit: () => {
              const term = termGroup.get(id)
              if (!term) return
              termGroup.delete(id)
              ws.send(sendData({ event: 'remove', data: id }))
            },
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
          term.resize({
            cols: data.data.cols,
            rows: data.data.rows,
          })
        }

        if (data.event === 'term') {
          const id = data.data.id
          const term = termGroup.get(id)
          if (!term) return
          Bun.write(term.fd(), data.data.data)
        }
      },
      onClose: () => {
        log.info('websocket closed')
        for (const term of termGroup.values()) {
          killTerm(term)
        }
      },
      onError: () => {
        log.error('websocket error')
        for (const term of termGroup.values()) {
          killTerm(term)
        }
      },
      onUpgrade: () => {
        log.info('websocket upgraded')
      },
      onOpen: () => {
        log.info('websocket opened')
      },
    }
  })
)

function createTerm({
  id,
  ws,
  onExit,
}: {
  id: string
  ws: WSContext
  onExit: () => void
}) {
  const USER = 'coedit'
  const WORKSPACE = `/home/${USER}/workspace`

  const pty = new Pty({
    command: 'su',
    args: [
      USER,
      '--login',
      '--pty',
      '-c',
      `cd ${WORKSPACE}; devbox init && devbox shell`,
    ],
    envs: {
      TERM: 'xterm-256color',
    },
    onExit,
    onData: (error, data) => {
      if (error) return
      ws.send(sendData({ event: 'term', data: { id, data: data.toString() } }))
    },
  })

  return pty
}

function killTerm(term: Pty) {
  try {
    const pid = term.pid
    term.close()
    process.kill(pid)
  } catch (error) {
    log.error('error while killing term')
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
  setActive()
  return JSON.stringify(data)
}

function getData(data: string) {
  setActive()
  return JSON.parse(data) as
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

export type TerminalGetData = ReturnType<typeof getData>
export type TerminalSendData = Parameters<typeof sendData>[0]

export const terminalRoute = h().route('/', terminal)
