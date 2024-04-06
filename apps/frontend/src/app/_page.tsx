'use client'

import React from 'react'
import { useAtomValue } from 'jotai'

import AppLayout from '#/app/(app)/layout'
import HomePage from '#/app/home/page'
import { isAuthAtom } from '#/store'

export default function Page() {
  const isAuth = useAtomValue(isAuthAtom)

  if (isAuth) {
    return <AppLayout />
  }

  return <HomePage />
}
