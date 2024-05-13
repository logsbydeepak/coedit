'use client'

import { atom } from 'jotai'

export const publicIPAtom = atom('localhost:4000')

export const editFileAtom = atom<{
  path: string
  name: string
} | null>(null)
