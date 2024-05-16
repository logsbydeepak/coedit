'use client'

import { atom, createStore } from 'jotai'

export const publicIPAtom = atom('')

export const store = createStore()
export const editFileAtom = atom<{
  path: string
  name: string
} | null>(null)
