'use client'

import { isAuthAtom } from '@/store'
import { useAtomValue } from 'jotai'
import { useRouter } from 'next/navigation'
import React from 'react'

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
