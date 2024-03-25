'use client'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

export default function Page() {
  return (
    <ResizablePanelGroup direction="horizontal" className="absolute">
      <ResizablePanel defaultSize={20}>
        <FileExplorer />
      </ResizablePanel>

      <ResizableHandle withHandle />

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

function Terminal() {
  return <h1>Terminal</h1>
}

function Editor() {
  return <h1>Editor</h1>
}

function FileExplorer() {
  return <h1>File Explorer</h1>
}

function Output() {
  return <h1>Output</h1>
}
