'use client'

import type { ITextEditorOptions } from '@codingame/monaco-vscode-api/vscode/vs/platform/editor/common/editor'
import type { OpenEditor } from '@codingame/monaco-vscode-editor-service-override'

import {
  activeEditorRef,
  basename,
  editFileAtom,
  store,
  toWorkspaceRelativePath,
} from './store'

async function waitForModel(uriPath: string, timeoutMs = 3000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const current = activeEditorRef.current
    if (current?.getModel()?.uri.path === uriPath) return current
    await new Promise((resolve) => setTimeout(resolve, 30))
  }
  return null
}

// Handles Go to Definition / References / Peek from monaco-vscode-api via
// the same editFileAtom path as the file explorer.
// Cast reconciles monaco-editor vs editor-service-override duplicate types.
export const openEditor = (async (modelRef, rawOptions) => {
  const uriPath = modelRef?.object?.textEditorModel?.uri?.path
  if (!uriPath) return activeEditorRef.current

  const rel = toWorkspaceRelativePath(uriPath)
  if (rel === null || rel === '/') return activeEditorRef.current

  store.set(editFileAtom, { path: rel, name: basename(rel) })

  const target = (await waitForModel(uriPath)) ?? activeEditorRef.current
  if (!target) return null

  const options = rawOptions as ITextEditorOptions | undefined
  const selection = options?.selection
  if (selection) {
    const range = {
      startLineNumber: selection.startLineNumber,
      startColumn: selection.startColumn,
      endLineNumber: selection.endLineNumber ?? selection.startLineNumber,
      endColumn: selection.endColumn ?? selection.startColumn,
    }
    target.setSelection(range)
    target.revealRangeInCenterIfOutsideViewport(range)
  }

  return target
}) as OpenEditor
