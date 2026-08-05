'use client'

import * as ResizablePrimitive from 'react-resizable-panels'

import { cn } from '#/utils/style'

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Group>) => (
  <ResizablePrimitive.Group
    className={cn('flex size-full', className)}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.Separator
    className={cn(
      'group relative flex w-px items-center justify-center bg-gray-4 after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-gray-4 focus-visible:ring-offset-1 focus-visible:outline-none aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-1 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2',
      'data-[separator=active]:bg-sage-11 data-[separator=hover]:bg-sage-10',
      className
    )}
    {...props}
  >
    {withHandle && (
      <div
        className={cn(
          'absolute top-1/2 left-1/2 z-10 h-5 w-1 -translate-1/2 rounded-full bg-gray-6',
          'group-aria-[orientation=horizontal]:h-1 group-aria-[orientation=horizontal]:w-5',
          'group-data-[separator=active]:bg-sage-11 group-data-[separator=hover]:bg-sage-10'
        )}
      />
    )}
  </ResizablePrimitive.Separator>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
