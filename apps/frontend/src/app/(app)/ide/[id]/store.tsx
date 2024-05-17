'use client'

import { atom, createStore } from 'jotai'

export const publicIPAtom = atom('')

export const store = createStore()
export const editFileAtom = atom<{
  path: string
  name: string
} | null>(null)

export const tokenAtom = atom('')

export const getToken = () => store.get(tokenAtom)

const IP = () => store.get(publicIPAtom)

export const containerURL = () => ({
  api: `http://${IP()}:4000`,
  term: `ws://${IP()}:4000/ws`,
  output: `http://${IP()}:3000`,
})
