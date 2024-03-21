'use client'

import React, { useRef } from 'react'
import { Terminal } from 'xterm'
import { AttachAddon } from 'xterm-addon-attach'
import { WebglAddon } from 'xterm-addon-webgl'

import 'xterm/css/xterm.css'

export default function Term({ WS_URL }: { WS_URL: string }) {
  const terminalRef = useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (terminalRef.current) {
      const term = new Terminal()
      const addon = new WebglAddon()

      const webSocket = new WebSocket(WS_URL)
      const attachAddon = new AttachAddon(webSocket)

      term.open(terminalRef.current)
      term.loadAddon(attachAddon)
      term.loadAddon(addon)

      return () => {
        webSocket.close()
        addon.dispose()
        attachAddon.dispose()
        term.dispose()
      }
    }
  }, [WS_URL])

  return <div ref={terminalRef} />
}
