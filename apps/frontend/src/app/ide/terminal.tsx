'use client'

import React, { useRef } from 'react'
import { Terminal } from 'xterm'
import { WebglAddon } from 'xterm-addon-webgl'

import 'xterm/css/xterm.css'

export default function Term() {
  const terminalRef = useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (terminalRef.current) {
      const term = new Terminal()

      term.open(terminalRef.current)

      const addon = new WebglAddon()

      term.onResize((size) => {
        console.log(size)
      })

      term.open(terminalRef.current)
      term.loadAddon(addon)

      return () => {
        addon.dispose()
        term.dispose()
      }
    }
  }, [])

  return <div ref={terminalRef} />
}
