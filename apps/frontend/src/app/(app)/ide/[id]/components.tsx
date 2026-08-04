'use client'

import { useHydrateAtoms } from 'jotai/utils'
import { LoaderIcon, type LucideIcon } from 'lucide-react'

import { cn } from '#/utils/style'

import { tokenAtom } from './store'

export function StatusContainer({
  children,
  className,
}: React.HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex size-full items-center justify-center px-5 py-14 pt-14',
        className
      )}
    >
      {children}
    </div>
  )
}

export function Status({
  children,
  isLoading = false,
  Icon,
  className,
}: React.HtmlHTMLAttributes<HTMLDivElement> & {
  isLoading?: boolean
  Icon?: LucideIcon
}) {
  return (
    <div
      className={cn(
        'bg-gray-5 flex items-center space-x-1 rounded-full px-3 py-1 font-mono text-xs',
        className
      )}
    >
      {isLoading ? (
        <LoaderIcon className="text-gray-11 size-3 shrink-0 animate-spin" />
      ) : (
        Icon && <Icon className="size-3 shrink-0" />
      )}
      <p className="min-w-0 break-words">{children}</p>
    </div>
  )
}

export function SetToken({ token }: { token: string }) {
  useHydrateAtoms([[tokenAtom, token]])
  return null
}
