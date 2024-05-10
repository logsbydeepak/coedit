'use client'

import { atom } from 'jotai'


export const editFileAtom = atom<{
  path: string
  name: string
} | null>(null)
