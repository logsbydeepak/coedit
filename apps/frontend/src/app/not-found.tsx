'use client'

import Link from 'next/link'

import { Alert } from '#/components/icons/alert'
import { LogoIcon } from '#/components/icons/logo'
import { buttonStyle } from '#/components/ui/button'
import { cn } from '#/utils/style'

export default function NotFound() {
  return (
    <div className="absolute flex min-h-full w-full items-center justify-center text-center">
      <div className="flex w-80 flex-col space-y-6 p-4">
        <div className="flex items-center justify-center space-x-2">
          <div className="flex items-center justify-center space-x-2 text-sage-9">
            <LogoIcon className="size-6" />
            <p className="text-center font-mono text-xl font-medium text-white">
              coedit
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Alert message="Not Found" type="destructive" isOpen align="center" />
          <Link
            className={cn(buttonStyle({ intent: 'secondary' }), 'w-full')}
            href="/"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
