'use client'

import '@xterm/xterm/css/xterm.css'

import React from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { FitAddon } from '@xterm/addon-fit'
import { WebglAddon } from '@xterm/addon-webgl'
import { ITheme, Terminal } from '@xterm/xterm'
import { useAtomValue } from 'jotai'
import { PlusIcon, XIcon } from 'lucide-react'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { toast } from 'sonner'

import type {
  WSSendData as WSGetData,
  WSGetData as WSSendData,
} from '@coedit/container'

import { Status, StatusContainer } from './components'
import { publicIPAtom } from './store'

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
  background: '#191919',
}

const useSocket = (url: string) =>
  useWebSocket(url, {
    retryOnError: true,
    reconnectInterval: 3000,
    shouldReconnect: () => true,
  })
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
    <StatusContainer>
      <Status isLoading={connectionStatus === 'connecting'}>
        {connectionStatus}
      </Status>
    </StatusContainer>
  )
}

function TermGroup({ socket }: { socket: Socket }) {
  const [activeTab, setActiveTab] = React.useState<string | null>(null)
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
          setActiveTab(data.data)
          break
        case 'remove':
          const id = data.data
          const index = tabs.findIndex((tab) => tab.id === id)
          if (index === -1) return

          if (activeTab === id) {
            const nextIndex = index === 0 ? 1 : index - 1
            const nextTab = tabs[nextIndex]
            setActiveTab(nextTab ? nextTab.id : null)
          }
          setTabs((tabs) => tabs.filter((tab) => tab.id !== id))

          break
        case 'term':
          setTermData(data.data)
          break
      }
    }
  }, [getWebSocket, activeTab, tabs])

  return (
    <Tabs.Root
      className="flex h-full flex-col text-xs"
      value={activeTab || ''}
      onValueChange={(value) => setActiveTab(value)}
    >
      <div className="flex h-8 items-center justify-between border-b border-gray-4">
        <Tabs.List className="no-scrollbar flex items-center overflow-x-scroll">
          {tabs.map((tab, idx) => (
            <TermTab key={tab.id} tab={tab} idx={idx} removeTab={removeTab} />
          ))}
        </Tabs.List>

        <button
          onClick={addTab}
          className="flex size-7 items-center justify-center border-l border-gray-4"
        >
          <PlusIcon className="size-3" />
        </button>
      </div>

      {tabs.length === 0 && (
        <StatusContainer>
          <Status>no terminal</Status>
        </StatusContainer>
      )}

      {!activeTab && tabs.length !== 0 && (
        <StatusContainer>
          <Status>select a terminal</Status>
        </StatusContainer>
      )}

      {tabs.length !== 0 && (
        <div className="relative size-full">
          {tabs.map((tab) => (
            <Tabs.Content
              key={tab.id}
              value={tab.id}
              forceMount
              className="absolute inset-0 z-20 size-full overflow-hidden data-[state=inactive]:z-10"
            >
              <TermContent id={tab.id} socket={socket} data={termData} />
            </Tabs.Content>
          ))}
        </div>
      )}
    </Tabs.Root>
  )
}

type Tab = {
  id: string
  name: string
}

function TermTab({
  tab,
  idx,
  removeTab,
}: {
  tab: Tab
  idx: number
  removeTab: (id: string) => void
}) {
  return (
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
      theme,
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      fontWeight: '400',
      fontSize: 13,
      letterSpacing: 1,
    })
    terminalRef.current = term

    const webglAddon = new WebglAddon()
    const fitAddon = new FitAddon()

    term.loadAddon(webglAddon)
    term.loadAddon(fitAddon)
    term.open(termRef.current)
    term.focus()

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
      fitAddon.fit()
    })

    resizeObserver.observe(termRef.current)

    return () => {
      resizeObserver.disconnect()
      webglAddon.dispose()
      fitAddon.dispose()
      term.dispose()
    }
  }, [sendMessage, id])

  return <div ref={termRef} className="size-full overflow-hidden" />
}

function getData(data: string) {
  return JSON.parse(data) as WSGetData
}

function sendData(data: WSSendData): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(data))
}
