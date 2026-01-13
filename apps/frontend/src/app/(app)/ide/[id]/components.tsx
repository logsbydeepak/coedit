'use client'

import { useHydrateAtoms } from 'jotai/utils'
import { LoaderIcon } from 'lucide-react'

import { cn } from '#/utils/style'

import { tokenAtom } from './store'

export function StatusContainer({
  children,
  className,
}: React.HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex size-full items-center justify-center pt-14 text-center',
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
}: React.PropsWithChildren<{ isLoading?: boolean }>) {
  return (
    <div className="bg-gray-5 flex items-center space-x-1 rounded-full px-3 py-1 font-mono text-xs">
      {isLoading && <LoaderIcon className="text-gray-11 size-3 animate-spin" />}
      <p>{children}</p>
    </div>
  )
}

export function SetToken({ token }: { token: string }) {
  useHydrateAtoms([[tokenAtom, token]])
  return null
}
