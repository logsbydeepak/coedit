import React from 'react'
import { Dialog } from 'radix-ui'

import { cn } from '#/utils/style'

const DialogClose = Dialog.Close

function DialogRoot({
  children,
  ...props
}: React.ComponentProps<typeof Dialog.Root>) {
  return (
    <Dialog.Root {...props}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-gray-1/50 fixed inset-0 z-30 backdrop-blur-sm" />
        {children}
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function DialogContent({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Dialog.Content>) {
  return (
    <Dialog.Content
      className={cn(
        'border-gray-3 bg-gray-2 fixed z-50 border p-6',
        'top-1/2 left-1/2 w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-lg drop-shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </Dialog.Content>
  )
}

function DialogTitle({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Dialog.Title>) {
  return (
    <Dialog.Title
      className={cn('text-gray-12 text-lg font-medium', className)}
      {...props}
    >
      {children}
    </Dialog.Title>
  )
}

function DialogDescription({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Dialog.Description>) {
  return (
    <Dialog.Description
      className={cn(
        'text-gray-11 overflow-hidden text-sm text-ellipsis',
        className
      )}
      {...props}
    >
      {children}
    </Dialog.Description>
  )
}

export {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
}
