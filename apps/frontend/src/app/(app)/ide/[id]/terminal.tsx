'use client'

import '@xterm/xterm/css/xterm.css'

import React from 'react'
import { ITheme, Terminal } from '@xterm/xterm'
import { useAtomValue } from 'jotai'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { FitAddon } from 'xterm-addon-fit'
import { WebglAddon } from 'xterm-addon-webgl'

import { publicIPAtom } from '../store'

const theme: ITheme = {
  red: '#f07178',
  green: '#C3E88D',
  yellow: '#FFCB6B',
  blue: '#82AAFF',
  magenta: '#C792EA',
  cyan: '#89DDFF',
  white: '#ffffff',
  black: '#000000',
  brightBlack: '#545454',
  brightRed: '#f07178',
  brightGreen: '#C3E88D',
  brightYellow: '#FFCB6B',
  brightBlue: '#82AAFF',
  brightMagenta: '#C792EA',
  brightCyan: '#89DDFF',
  brightWhite: '#ffffff',
  cursor: '#FFCB6B',
  cursorAccent: '#000000',
}

export default function Term() {
  const publicIP = useAtomValue(publicIPAtom)

  const WS_URL = `ws://${publicIP}/ws`

  const termRef = React.useRef<HTMLDivElement | null>(null)
  const { readyState, getWebSocket, sendJsonMessage } = useWebSocket(WS_URL)

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'connecting' as const,
    [ReadyState.OPEN]: 'open' as const,
    [ReadyState.CLOSING]: 'closing' as const,
    [ReadyState.CLOSED]: 'closed' as const,
    [ReadyState.UNINSTANTIATED]: 'uninstantiated' as const,
  }[readyState]

  React.useEffect(() => {
    if (!termRef.current) return
    if (connectionStatus !== 'open') return
    const ws = getWebSocket()
    if (!ws) return

    const term = new Terminal({
      fontSize: 14,
      fontFamily: 'var(--font-geist-mono)',
      fontWeight: 'normal',
      lineHeight: 1.5,
      letterSpacing: -2,
      theme,
    })
    const webglAddon = new WebglAddon()
    const fitAddon = new FitAddon()

    term.loadAddon(webglAddon)
    term.loadAddon(fitAddon)
    term.open(termRef.current)

    term.onData((data) => {
      sendJsonMessage({ type: 'input', data })
    })

    ws.onmessage = (event) => {
      term.write(event.data)
    }

    const resizeObserver = new ResizeObserver(() => {
      sendJsonMessage({
        type: 'resize',
        data: {
          cols: term.cols,
          rows: term.rows,
        },
      })
      fitAddon.fit()
    })

    resizeObserver.observe(termRef.current)
    return () => {
      resizeObserver.disconnect()
      webglAddon.dispose()
      fitAddon.dispose()
      term.dispose()
    }
  }, [connectionStatus, getWebSocket, sendJsonMessage])

  return (
    <>
      {connectionStatus !== 'open' && (
        <div className="flex size-full items-center justify-center">
          {connectionStatus === 'connecting' && (
            <div className="font-mono">connecting...</div>
          )}
          {connectionStatus === 'closing' && (
            <div className="font-mono">closing...</div>
          )}
          {connectionStatus === 'closed' && (
            <div className="font-mono">closed</div>
          )}
          {connectionStatus === 'uninstantiated' && (
            <div className="font-mono">uninstantiated</div>
          )}
        </div>
      )}
      {connectionStatus === 'open' && (
        <div ref={termRef} className="size-full" />
      )}
    </>
  )
}
