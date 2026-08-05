'use client'

import React from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { XIcon } from 'lucide-react'

import { cn } from '#/utils/style'

export const TabItem = React.forwardRef<
  HTMLDivElement,
  {
    value: string
    onClose: () => void
    closeLabel: string
    isDirty?: boolean
    className?: string
    children: React.ReactNode
  }
>(function TabItem(
  { value, onClose, closeLabel, isDirty = false, className, children },
  ref
) {
  return (
    <div
      ref={ref}
      onAuxClick={(event) => {
        if (event.button === 1) onClose()
      }}
      className={cn(
        'group flex h-full shrink-0 items-center justify-between',
        'border-b-2 border-b-transparent transition-colors duration-150',
        'hover:bg-gray-3 has-[>[aria-selected=true]]:border-b-sage-9 has-[>[aria-selected=true]]:bg-gray-4',
        className
      )}
    >
      <Tabs.Trigger
        value={value}
        className="peer flex h-full min-w-0 flex-1 items-center space-x-1.5 overflow-hidden pl-2.5 text-ellipsis text-gray-11 outline-none hover:text-gray-12 aria-selected:text-gray-12"
      >
        {children}
      </Tabs.Trigger>

      <button
        type="button"
        aria-label={closeLabel}
        className={cn(
          'text-gray-11 hover:bg-sage-4 hover:text-gray-12',
          'relative mr-1 flex size-6 shrink-0 focus-visible:ring-sage-9',
          'items-center justify-center rounded outline-none ring-inset',
          'transition-colors focus-visible:ring-1'
        )}
        onClick={(event) => {
          event.stopPropagation()
          onClose()
        }}
      >
        {isDirty && (
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-0 flex items-center justify-center',
              'scale-100 opacity-100 transition-[opacity,transform] duration-150',
              'ease-[cubic-bezier(0.2,0,0,1)]',
              'group-hover:scale-75 group-hover:opacity-0',
              'peer-aria-[selected=true]:scale-75 peer-aria-[selected=true]:opacity-0'
            )}
          >
            <span className="size-1.5 rounded-full bg-gray-12" />
          </span>
        )}
        <XIcon
          aria-hidden
          className={cn(
            'pointer-events-none size-3 scale-75 opacity-0',
            'transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)]',
            'group-hover:scale-100 group-hover:opacity-100',
            'peer-aria-[selected=true]:scale-100 peer-aria-[selected=true]:opacity-100'
          )}
        />
      </button>
    </div>
  )
})
