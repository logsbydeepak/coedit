'use client'

import { atom, createStore } from 'jotai'

export const containerURLAtom = atom({
  api: '',
  output: '',
})

export const store = createStore()
export const editFileAtom = atom<{
  path: string
  name: string
} | null>(null)

// Controls the "Ctrl+P"/"Cmd+P" quick-open file search dialog.
export const quickOpenAtom = atom(false)

export const tokenAtom = atom('')

export const getToken = () => store.get(tokenAtom)

export const containerURL = () => ({
  api: store.get(containerURLAtom).api,
  output: store.get(containerURLAtom).output,
})
