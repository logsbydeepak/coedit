'use client'

import { GripVertical } from 'lucide-react'
import * as Resizable from 'react-resizable-panels'

import { cn } from '#/utils/style'

export { Panel as ResizablePanel } from 'react-resizable-panels'

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof Resizable.Group>) {
  return (
    <Resizable.Group
      data-slot="resizable-panel-group"
      className={cn(
        'flex h-full w-full data-[panel-group-direction=vertical]:flex-col',
        className
      )}
      {...props}
    />
  )
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Resizable.Separator> & {
  withHandle?: boolean
}) {
  return (
    <Resizable.Separator
      className={cn(
        'bg-gray-4 focus-visible:ring-sage-4 relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:-translate-y-1/2 [&[data-panel-group-direction=vertical]>div]:rotate-90',
        'data-[separator="active"]:bg-sage-8 data-[separator="hover"]:bg-sage-7',
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="border-gray-5 bg-gray-6 z-10 flex h-4 w-3 items-center justify-center rounded-sm border">
          <GripVertical className="size-2.5" />
        </div>
      )}
    </Resizable.Separator>
  )
}

export { ResizablePanelGroup, ResizableHandle }
