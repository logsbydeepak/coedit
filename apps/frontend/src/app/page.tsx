'use client'

import HomePage from '@/app/home/page'
import AppPage from '@/app/(app)/app/page'
import { useAtomValue } from 'jotai'
import React from 'react'
import { isAuthAtom } from '@/store'

export default function Page() {
  const isAuth = useAtomValue(isAuthAtom)

  if (isAuth) {
    return <AppPage />
  }

  return <HomePage />
}
