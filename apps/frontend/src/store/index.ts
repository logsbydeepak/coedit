'use client'

import { atomWithStorage } from 'jotai/utils'

export const isAuthAtom = atomWithStorage('x-auth', false)
