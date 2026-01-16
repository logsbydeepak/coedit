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
    <div className="absolute inset-0 pt-[57px]">
      <ResizablePanelGroup orientation="horizontal" className="min-h-full">
        <ResizablePanel defaultSize={14} collapsible={true} minSize={10}>
          <FileExplorer />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={56} collapsible={true} minSize={20}>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={74} collapsible={true} minSize={20}>
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
