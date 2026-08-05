'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { useAtom } from 'jotai'
import { usePanelRef, type PanelSize } from 'react-resizable-panels'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '#/components/ui/resizable'

import {
  previewVisibleAtom,
  sidebarVisibleAtom,
  terminalVisibleAtom,
} from './store'

const Editor = dynamic(() => import('./editor'), { ssr: false })
const Terminal = dynamic(() => import('./terminal'), { ssr: false })
const FileExplorer = dynamic(() => import('./file-explorer'), { ssr: false })
const Output = dynamic(() => import('./output'), { ssr: false })
const QuickOpen = dynamic(() => import('./quick-open'), { ssr: false })

function usePanelVisibility(
  panelRef: ReturnType<typeof usePanelRef>,
  visible: boolean,
  setVisible: (visible: boolean) => void
) {
  React.useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    if (visible && panel.isCollapsed()) panel.expand()
    if (!visible && !panel.isCollapsed()) panel.collapse()
  }, [panelRef, visible])

  return {
    panelRef,
    onResize: (panelSize: PanelSize) => setVisible(panelSize.asPercentage > 0),
  }
}

export function IDE() {
  const [sidebarVisible, setSidebarVisible] = useAtom(sidebarVisibleAtom)
  const [terminalVisible, setTerminalVisible] = useAtom(terminalVisibleAtom)
  const [previewVisible, setPreviewVisible] = useAtom(previewVisibleAtom)

  const sidebarPanel = usePanelVisibility(
    usePanelRef(),
    sidebarVisible,
    setSidebarVisible
  )
  const terminalPanel = usePanelVisibility(
    usePanelRef(),
    terminalVisible,
    setTerminalVisible
  )
  const previewPanel = usePanelVisibility(
    usePanelRef(),
    previewVisible,
    setPreviewVisible
  )

  return (
    <div className="absolute inset-0 overflow-hidden pt-[57px]">
      <QuickOpen />

      <ResizablePanelGroup orientation="horizontal" className="h-full">
        <ResizablePanel
          defaultSize="14%"
          collapsible={true}
          minSize="10%"
          {...sidebarPanel}
        >
          <FileExplorer />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize="56%" collapsible={true} minSize="20%">
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize="74%" collapsible={true} minSize="20%">
              <Editor />
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel
              defaultSize="26%"
              collapsible={true}
              minSize="10%"
              {...terminalPanel}
            >
              <Terminal />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel
          defaultSize="30%"
          collapsible={true}
          minSize="10%"
          {...previewPanel}
        >
          <Output />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
