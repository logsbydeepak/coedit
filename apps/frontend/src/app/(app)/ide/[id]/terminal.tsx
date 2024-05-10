'use client'

import '@xterm/xterm/css/xterm.css'

import React from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { ITheme, Terminal } from '@xterm/xterm'
import { useAtomValue } from 'jotai'
import { LoaderIcon, PlusIcon, XIcon } from 'lucide-react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { toast } from 'sonner'
import { ulid } from 'ulidx'
import { FitAddon } from 'xterm-addon-fit'
import { WebglAddon } from 'xterm-addon-webgl'

import type {
  WSSendData as WSGetData,
  WSGetData as WSSendData,
} from '@coedit/container'

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
}

const useSocket = (url: string) => useWebSocket(url)
type Socket = ReturnType<typeof useSocket>

export default function Term() {
  const publicIP = useAtomValue(publicIPAtom)
  const WS_URL = `ws://${publicIP}/ws`
  const socket = useSocket(WS_URL)

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'connecting' as const,
    [ReadyState.OPEN]: 'open' as const,
    [ReadyState.CLOSING]: 'closing' as const,
    [ReadyState.CLOSED]: 'closed' as const,
    [ReadyState.UNINSTANTIATED]: 'uninstantiated' as const,
  }[socket.readyState]

  if (connectionStatus === 'open') {
    return <TermGroup socket={socket} />
  }

  return (
    <Container>
      {connectionStatus === 'connecting' && (
        <Status isLoading>connecting</Status>
      )}
      {connectionStatus === 'closing' && <Status isLoading>closing</Status>}
      {connectionStatus === 'closed' && <Status>closed</Status>}
      {connectionStatus === 'uninstantiated' && <Status>uninstantiated</Status>}
    </Container>
  )
}

function TermGroup({ socket }: { socket: Socket }) {
  const [termData, setTermData] = React.useState<{
    id: string
    data: string
  } | null>(null)

  const { getWebSocket, sendMessage } = socket

  const [tabs, setTabs] = React.useState<
    {
      id: string
      name: string
    }[]
  >([])

  const addTab = () => {
    if (tabs.length >= 5) {
      toast.error('max tabs reached')
      return
    }

    sendMessage(
      sendData({
        event: 'add',
        data: undefined,
      })
    )
  }

  const removeTab = (id: string) => {
    sendMessage(
      sendData({
        event: 'remove',
        data: id,
      })
    )
  }

  React.useEffect(() => {
    const ws = getWebSocket()
    if (!ws) return
    ws.onmessage = (e) => {
      const data = getData(e.data)
      switch (data.event) {
        case 'add':
          setTabs((tabs) => [
            ...tabs,
            {
              id: data.data,
              name: 'term',
            },
          ])
          break
        case 'remove':
          setTabs((tabs) => tabs.filter((tab) => tab.id !== data.data))
          break
        case 'term':
          setTermData(data.data)
          break
      }
    }
  }, [getWebSocket])

  return (
    <Tabs.Root className="flex size-full flex-col text-xs">
      <div className="flex h-8 items-center justify-between border-b border-gray-4">
        <Tabs.List className="no-scrollbar flex items-center overflow-x-scroll">
          {tabs.map((tab, idx) => (
            <div
              key={tab.id}
              className="group flex h-full items-center border-sage-9 hover:bg-gray-3 has-[>[aria-selected=true]]:border-b-2 has-[>[aria-selected=true]]:bg-gray-4"
            >
              <Tabs.Trigger
                value={tab.id}
                className="pl-4 text-gray-11 hover:text-gray-12 aria-[selected=true]:text-gray-12"
              >
                <p className="flex items-center space-x-1">
                  <span className="font-mono">{idx + 1}:</span>
                  <span>{tab.name}</span>
                </p>
              </Tabs.Trigger>
              <button className="flex size-7 items-center justify-center text-gray-11 hover:text-gray-12">
                <XIcon
                  className="hidden size-3 group-hover:block"
                  onClick={() => removeTab(tab.id)}
                />
              </button>
            </div>
          ))}
        </Tabs.List>

        <button
          onClick={addTab}
          className="flex size-7 items-center justify-center border-l border-gray-4"
        >
          <PlusIcon className="size-3" />
        </button>
      </div>

      <div className="size-full">
        {tabs.length === 0 && (
          <Container>
            <Status>no terminal</Status>
          </Container>
        )}

        {tabs.map((tab) => (
          <Tabs.Content
            key={tab.id}
            value={tab.id}
            forceMount
            className="size-full data-[state=inactive]:hidden"
          >
            <TermContent id={tab.id} socket={socket} data={termData} />
          </Tabs.Content>
        ))}
      </div>
    </Tabs.Root>
  )
}

function TermContent({
  id,
  socket,
  data,
}: {
  id: string
  socket: Socket
  data: {
    id: string
    data: string
  } | null
}) {
  const terminalRef = React.useRef<Terminal | null>(null)
  const termRef = React.useRef<HTMLDivElement | null>(null)
  const { sendMessage } = socket

  React.useEffect(() => {
    if (!terminalRef.current || !data) return
    if (data.id !== id) return
    terminalRef.current.write(data.data)
  }, [data, id])

  React.useEffect(() => {
    if (!termRef.current) return

    const term = new Terminal({
      fontSize: 13,
      fontFamily: 'var(--font-geist-mono)',
      fontWeight: '400',
      lineHeight: 1.5,
      letterSpacing: -3.5,
      theme,
    })
    terminalRef.current = term

    const webglAddon = new WebglAddon()
    const fitAddon = new FitAddon()

    term.loadAddon(webglAddon)
    term.loadAddon(fitAddon)
    term.open(termRef.current)

    term.onData((data) => {
      sendMessage(
        sendData({
          event: 'term',
          data: {
            id,
            data,
          },
        })
      )
    })

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit()
      sendMessage(
        sendData({
          event: 'resize',
          data: {
            id,
            cols: term.cols,
            rows: term.rows,
          },
        })
      )
    })

    resizeObserver.observe(termRef.current)
    return () => {
      resizeObserver.disconnect()
      webglAddon.dispose()
      fitAddon.dispose()
      term.dispose()
    }
  }, [sendMessage, id])

  return <div ref={termRef} className="size-full" />
}

function getData(data: string) {
  return JSON.parse(data) as WSGetData
}

function sendData(data: WSSendData): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(data))
}

function Container({ children }: React.HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <div className="flex size-full items-center justify-center text-center">
      {children}
    </div>
  )
}

function Status({
  children,
  isLoading = false,
}: React.PropsWithChildren<{ isLoading?: boolean }>) {
  return (
    <div className="flex items-center space-x-1 rounded-full bg-gray-5 px-3 py-1 font-mono text-xs">
      {isLoading && <LoaderIcon className="size-3 animate-spin text-gray-11" />}
      <p>{children}</p>
    </div>
  )
}
