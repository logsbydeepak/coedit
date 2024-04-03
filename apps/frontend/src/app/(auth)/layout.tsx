'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAtomValue } from 'jotai'

import { LogoIcon } from '#/components/icons/logo'
import { isAuthAtom } from '#/store'

export default function Layout({ children }: React.PropsWithChildren) {
  const isAuth = useAtomValue(isAuthAtom)
  const router = useRouter()

  React.useEffect(() => {
    if (isAuth) router.push('/')
  }, [router, isAuth])

  if (isAuth) {
    return null
  }

  return (
    <div className="absolute flex min-h-full w-full items-center justify-center">
      <div className="flex w-96 flex-col space-y-4 border-gray-1 p-6">
        <div className="flex justify-center">
          <LogoIcon className="size-10 text-sage-9" />
        </div>

        {children}
      </div>
    </div>
  )
}
