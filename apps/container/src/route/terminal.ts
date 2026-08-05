import { upgradeWebSocket } from 'hono/bun'
import { WSContext } from 'hono/ws'

import { genID } from '@coedit/id'

import { ensureDevboxReady, peekDevboxState } from '#/utils/environment'
import { h } from '#/utils/h'
import { setActive } from '#/utils/lifecycle'
import { log } from '#/utils/log'

const terminal = h().get(
  '/',
  upgradeWebSocket(() => {
    const termGroup = new Map<string, Bun.Subprocess>()

    return {
      onMessage: (rawData, ws) => {
        const data = getData(rawData.data.toString())

        switch (data.event) {
          case 'add': {
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
            break
          }

          case 'remove': {
            const id = data.data
            const term = termGroup.get(id)
            if (!term) return
            killTerm(term)
            termGroup.delete(id)
            ws.send(sendData({ event: 'remove', data: id }))
            break
          }

          case 'resize': {
            const id = data.data.id
            const term = termGroup.get(id)
            if (!term) return
            term.terminal?.resize(data.data.cols, data.data.rows)
            break
          }

          case 'term': {
            const id = data.data.id
            const term = termGroup.get(id)
            if (!term) return
            term.terminal?.write(data.data.data)
            break
          }
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

  // Opening a terminal never waits on devbox - peek at the current state
  // (non-blocking) instead of awaiting ensureDevboxReady(). If it's not
  // ready, open a plain shell immediately; devbox installation itself is
  // owned by utils/environment.ts (boot warm-up / environment panel).
  const env = peekDevboxState()
  if (env.status === 'idle') void ensureDevboxReady()

  // Always exec the system bash by absolute path, never bare `bash`
  // resolved via PATH. `devbox shellenv` prepends Nix's own bash build to
  // PATH, and that Nix bash doesn't correctly strip PS1's `\[`/`\]`
  // non-printing markers when drawing the prompt.
  const step =
    env.status === 'ready'
      ? 'eval "$(devbox shellenv 2>/dev/null || true)"'
      : env.status === 'error'
        ? dim(
            33,
            'devbox environment failed to set up - open the environment panel to see the error and restart it'
          )
        : dim(
            90,
            'devbox environment is still setting up - opening a plain shell for now'
          )

  const shellCommand = `cd ${WORKSPACE}; ${step}; exec /usr/bin/bash -i`

  const pty = Bun.spawn(['su', USER, '--login', '--pty', '-c', shellCommand], {
    terminal: {
      cols: 80,
      rows: 24,
      data(_terminal, data) {
        if (!data) return
        ws.send(
          sendData({ event: 'term', data: { id, data: data.toString() } })
        )
      },
    },
    env: {
      TERM: 'xterm-256color',
    },
    onExit,
  })

  return pty
}

function dim(color: number, message: string) {
  return `printf '\\033[${color}m${message}\\033[0m\\n'`
}

function killTerm(term: Bun.Subprocess) {
  try {
    term.terminal?.close()
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
