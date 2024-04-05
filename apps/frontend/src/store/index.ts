'use client'

import { atomWithStorage } from 'jotai/utils'

const isAuth =
  typeof window !== 'undefined'
    ? localStorage.getItem('x-auth') === 'true'
      ? true
      : false
    : false

export const isAuthAtom = atomWithStorage('x-auth', isAuth)
