'use client'

import { atom, createStore } from 'jotai'
import type { editor as MonacoEditorNS } from 'monaco-editor'

export const WORKSPACE_ROOT = '/home/coedit/workspace'

// Shared monaco instance for non-React callers (open-editor.ts).
export const activeEditorRef: {
  current: MonacoEditorNS.IStandaloneCodeEditor | null
} = { current: null }

export function toWorkspaceRelativePath(path: string): string | null {
  if (path === WORKSPACE_ROOT) return '/'
  if (!path.startsWith(`${WORKSPACE_ROOT}/`)) return null
  return path.slice(WORKSPACE_ROOT.length)
}

export function toFileUri(path: string) {
  return `file://${WORKSPACE_ROOT}${path}`
}

export function toFilePath(path: string) {
  return `${WORKSPACE_ROOT}${path}`
}

export function basename(path: string) {
  return path.slice(path.lastIndexOf('/') + 1)
}

export function dirname(path: string) {
  const idx = path.lastIndexOf('/')
  return idx <= 0 ? '/' : path.slice(0, idx)
}

export const containerURLAtom = atom({
  api: '',
  output: '',
})

export const store = createStore()
export const editFileAtom = atom<{
  path: string
  name: string
} | null>(null)

export const quickOpenAtom = atom(false)

export const tokenAtom = atom('')

export const getToken = () => store.get(tokenAtom)

export const containerURL = () => ({
  api: store.get(containerURLAtom).api,
  output: store.get(containerURLAtom).output,
})
