import React from 'react'
import {
  Close as DialogClosePrimitive,
  Content as DialogContentPrimitive,
  Description as DialogDescriptionPrimitive,
  Overlay as DialogOverlayPrimitive,
  Portal as DialogPortalPrimitive,
  Root as DialogRootPrimitive,
  Title as DialogTitlePrimitive,
} from '@radix-ui/react-dialog'

import { cn } from '#/utils/style'

const DialogClose = DialogClosePrimitive

const DialogRoot = ({
  children,
  ...props
}: React.ComponentProps<typeof DialogRootPrimitive>) => (
  <DialogRootPrimitive {...props}>
    <DialogPortalPrimitive>
      <DialogOverlayPrimitive className="bg-gray-1/50 fixed inset-0 z-30 backdrop-blur-sm" />

      {children}
    </DialogPortalPrimitive>
  </DialogRootPrimitive>
)

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContentPrimitive>,
  React.ComponentPropsWithoutRef<typeof DialogContentPrimitive>
>(({ children, className, ...props }, ref) => (
  <DialogContentPrimitive
    {...props}
    ref={ref}
    className={cn(
      'border-gray-3 bg-gray-2 fixed z-50 border p-6',
      'top-1/2 left-1/2 w-105 -translate-1/2 rounded-lg drop-shadow-sm',
      className
    )}
  >
    {children}
  </DialogContentPrimitive>
))
DialogContent.displayName = DialogContentPrimitive.displayName

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogTitlePrimitive>,
  React.ComponentPropsWithoutRef<typeof DialogTitlePrimitive>
>(({ children, className, ...props }, ref) => (
  <DialogTitlePrimitive
    {...props}
    ref={ref}
    className={cn('text-gray-12 text-lg font-medium', className)}
  >
    {children}
  </DialogTitlePrimitive>
))
DialogTitle.displayName = DialogTitlePrimitive.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogDescriptionPrimitive>,
  React.ComponentPropsWithoutRef<typeof DialogDescriptionPrimitive>
>(({ children, className, ...props }, ref) => (
  <DialogDescriptionPrimitive
    {...props}
    ref={ref}
    className={cn(
      'text-gray-11 overflow-hidden text-sm text-ellipsis',
      className
    )}
  >
    {children}
  </DialogDescriptionPrimitive>
))
DialogDescription.displayName = DialogDescriptionPrimitive.displayName

export {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
}
