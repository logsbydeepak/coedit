'use client'

import { isAuthAtom } from '@/store'
import { useAtomValue } from 'jotai'
import { useRouter } from 'next/navigation'
import React from 'react'

export default function Layout({ children }: React.PropsWithChildren) {
  const isAuth = useAtomValue(isAuthAtom)
  const router = useRouter()

  React.useEffect(() => {
    if (!isAuth) router.push('/')
  }, [isAuth, router])

  if (!isAuth) {
    return null
  }

  return children
}
