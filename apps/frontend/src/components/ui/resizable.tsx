'use client'

import { GripVertical } from 'lucide-react'
import * as Resizable from 'react-resizable-panels'

import { cn } from '#/utils/style'

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof Resizable.PanelGroup>) {
  return (
    <Resizable.PanelGroup
      className={cn(
        'flex size-full data-[panel-group-direction=vertical]:flex-col',
        className
      )}
      {...props}
    />
  )
}

const ResizablePanel = Resizable.Panel

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Resizable.PanelResizeHandle> & {
  withHandle?: boolean
}) {
  return (
    <Resizable.PanelResizeHandle
      className={cn(
        'bg-gray-4 focus-visible:ring-gray-4 relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-none data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:-translate-y-1/2 [&[data-panel-group-direction=vertical]>div]:rotate-90',
        'data-[resize-handle-state=drag]:bg-sage-11 data-[resize-handle-state=hover]:bg-sage-10',
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="border-gray-5 bg-gray-6 z-10 flex h-4 w-3 items-center justify-center rounded-sm border">
          <GripVertical className="size-2.5" />
        </div>
      )}
    </Resizable.PanelResizeHandle>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
