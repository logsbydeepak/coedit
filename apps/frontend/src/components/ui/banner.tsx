import React from 'react'
import { ZapIcon, type LucideIcon } from 'lucide-react'

import { cn } from '#/utils/style'

export function Banner({
  children,
  className,
  Icon = ZapIcon,
  ...props
}: React.ComponentProps<'div'> & { Icon?: LucideIcon }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-md border border-dashed border-gray-6 bg-gray-3 p-3 text-xs text-gray-11',
        className
      )}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-gray-10" />
      <p className="leading-relaxed">{children}</p>
    </div>
  )
}
