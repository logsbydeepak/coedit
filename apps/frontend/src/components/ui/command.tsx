import React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import { SearchIcon } from 'lucide-react'

import { cn } from '#/utils/style'

const CommandRoot = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn('flex size-full flex-col overflow-hidden', className)}
    {...props}
  />
))
CommandRoot.displayName = CommandPrimitive.displayName

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center space-x-2 border-b border-gray-3 px-3 py-2.5">
    <SearchIcon aria-hidden className="size-3.5 shrink-0 text-gray-11" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'w-full bg-transparent text-sm text-gray-12 outline-none placeholder:text-gray-9',
        className
      )}
      {...props}
    />
  </div>
))
CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn('scrollbar max-h-80 overflow-auto p-1', className)}
    {...props}
  />
))
CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => <CommandPrimitive.Empty ref={ref} {...props} />)
CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      'flex items-center px-2 py-1.5 text-sm',
      'w-full space-x-2 rounded ring-inset',
      'data-[selected=true]:bg-sage-4 data-[selected=true]:ring-1 data-[selected=true]:ring-sage-9',
      'overflow-hidden outline-none hover:cursor-pointer',
      className
    )}
    {...props}
  />
))
CommandItem.displayName = CommandPrimitive.Item.displayName

export { CommandRoot, CommandInput, CommandList, CommandEmpty, CommandItem }
