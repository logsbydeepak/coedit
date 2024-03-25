'use client'
import 'xterm/css/xterm.css'

import React from 'react'
import { Terminal } from 'xterm'
import { WebglAddon } from 'xterm-addon-webgl'
import { FitAddon } from 'xterm-addon-fit'

export default function Term() {
  return (
    <div
      className="overflow-hidden size-full"
      ref={(e) => {
        if (e === null) return

        const term = new Terminal({})
        const webglAddon = new WebglAddon()
        const fitAddon = new FitAddon()

        term.loadAddon(webglAddon)
        term.loadAddon(fitAddon)

        term.open(e)

        term.write('hi')

        term.onKey((e) => {
          term.write(e.key)
        })

        webglAddon.onContextLoss((e) => {
          webglAddon.dispose()
        })

        const resizeObserver = new ResizeObserver(() => {
          fitAddon.fit()
        })

        resizeObserver.observe(e)

        return () => {
          resizeObserver.disconnect()
          webglAddon.dispose()
          fitAddon.dispose()
          term.dispose()
        }
      }}
    />
  )
}
