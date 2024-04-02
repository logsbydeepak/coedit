'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAtomValue } from 'jotai'

import { isAuthAtom } from '#/store'

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
