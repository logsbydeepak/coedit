import { upgradeWebSocket } from 'hono/bun'
import { WSContext } from 'hono/ws'
import type { IWebSocket } from 'vscode-ws-jsonrpc'
import {
  createServerProcess,
  createWebSocketConnection,
  forward,
} from 'vscode-ws-jsonrpc/server'

import { ensureInstalled, type Language } from '#/utils/environment'
import { h } from '#/utils/h'
import { setActive } from '#/utils/lifecycle'
import { log } from '#/utils/log'

const USER = 'coedit'
const WORKSPACE = `/home/${USER}/workspace`

const LANGUAGE_SERVERS: Record<Language, string[]> = {
  typescript: ['typescript-language-server', '--stdio'],
  go: ['gopls'],
  rust: ['rust-analyzer'],
}

// Bridges Hono's callback-style WS handlers to the IWebSocket interface
// expected by vscode-ws-jsonrpc.
class HonoSocketAdapter implements IWebSocket {
  private messageHandler?: (data: unknown) => void
  private errorHandler?: (reason: unknown) => void
  private closeHandler?: (code: number, reason: string) => void

  constructor(private ws: WSContext) {}

  send(content: string) {
    this.ws.send(content)
  }

  onMessage(cb: (data: unknown) => void) {
    this.messageHandler = cb
  }

  onError(cb: (reason: unknown) => void) {
    this.errorHandler = cb
  }

  onClose(cb: (code: number, reason: string) => void) {
    this.closeHandler = cb
  }

  dispose() {
    this.ws.close()
  }

  emitMessage(data: unknown) {
    setActive()
    this.messageHandler?.(data)
  }

  emitError(reason: unknown) {
    this.errorHandler?.(reason)
  }

  emitClose() {
    this.closeHandler?.(1000, 'closed')
  }
}

const lsp = h().get(
  '/:language',
  upgradeWebSocket((c) => {
    const language = (c.req.param('language') ?? '') as Language
    const command = LANGUAGE_SERVERS[language]
    let adapter: HonoSocketAdapter | null = null

    return {
      onOpen: async (_evt, ws) => {
        if (!command) {
          log.error(`unsupported lsp language: ${language}`)
          ws.close()
          return
        }

        const state = await ensureInstalled(language)

        if (state.status === 'error') {
          log.error(
            { language, error: state.error },
            'lsp: environment not ready'
          )
          ws.send(
            JSON.stringify({
              event: 'error',
              message: `${language} language server isn't ready. Restart the environment from the navbar and try again.`,
            })
          )
          ws.close()
          return
        }

        adapter = new HonoSocketAdapter(ws)

        const shellCommand = [
          `cd ${WORKSPACE}`,
          'eval "$(devbox shellenv 2>/dev/null || true)"',
          `exec ${command.map(shellEscape).join(' ')}`,
        ].join(' && ')

        const serverConnection = createServerProcess(language, 'su', [
          USER,
          '--login',
          '-c',
          shellCommand,
        ])

        if (!serverConnection) {
          log.error(`failed to start lsp server: ${language}`)
          ws.close()
          return
        }

        const socketConnection = createWebSocketConnection(adapter)
        forward(socketConnection, serverConnection)
        log.info(`lsp server started: ${language}`)
      },
      onMessage: (evt) => {
        adapter?.emitMessage(evt.data.toString())
      },
      onClose: () => {
        log.info(`lsp websocket closed: ${language}`)
        adapter?.emitClose()
      },
      onError: () => {
        log.error(`lsp websocket error: ${language}`)
        adapter?.emitError(new Error('lsp websocket error'))
      },
    }
  })
)

function shellEscape(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

export const lspRoute = lsp
