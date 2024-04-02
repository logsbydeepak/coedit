'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAtomValue } from 'jotai'

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
      <div className="flex flex-col space-y-4 w-96 p-6">{children}</div>
    </div>
  )
}
