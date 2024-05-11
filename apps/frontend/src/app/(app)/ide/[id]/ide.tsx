'use client'

import React from 'react'
import dynamic from 'next/dynamic'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '#/components/ui/resizable'

const Editor = dynamic(() => import('./editor'), { ssr: false })
const Terminal = dynamic(() => import('./terminal'), { ssr: false })
const FileExplorer = dynamic(() => import('./file-explorer'), { ssr: false })
const Output = dynamic(() => import('./output'), { ssr: false })

export function IDE() {
  return (
    <div className="absolute inset-0 pt-14">
      <ResizablePanelGroup direction="horizontal" className="min-h-full">
        <ResizablePanel defaultSize={16} collapsible={true} minSize={10}>
          <FileExplorer />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={50}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={74}>
              <Editor />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={26} collapsible={true} minSize={10}>
              <Terminal />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={30} collapsible={true} minSize={10}>
          <Output />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
