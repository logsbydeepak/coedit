'use client'

import dynamic from 'next/dynamic'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '#/components/ui/resizable'

const Editor = dynamic(() => import('./editor'), { ssr: false })
const Terminal = dynamic(() => import('./terminal'), { ssr: false })

export function IDE() {
  return (
    <ResizablePanelGroup direction="horizontal" className="absolute pt-14">
      <ResizablePanel defaultSize={20}>
        <FileExplorer />
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel defaultSize={50}>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={75}>
            <Editor />
          </ResizablePanel>

          <ResizableHandle />

          <ResizablePanel defaultSize={25}>
            <Terminal />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel defaultSize={30}>
        <Output />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

function FileExplorer() {
  return <h1>File Explorer</h1>
}

function Output() {
  return <h1>Output</h1>
}
