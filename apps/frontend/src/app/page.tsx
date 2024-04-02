'use client'

import React from 'react'
import { useAtomValue } from 'jotai'

import AppPage from '#/app/(app)/app/page'
import HomePage from '#/app/home/page'
import { isAuthAtom } from '#/store'

export default function Page() {
  const isAuth = useAtomValue(isAuthAtom)

  if (isAuth) {
    return <AppPage />
  }

  return <HomePage />
}
