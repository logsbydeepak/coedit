'use client'

import React from 'react'
import Editor from '@monaco-editor/react'
import { useAtomValue } from 'jotai'

import { editFileAtom } from '../store'

export default function TextEditor() {
  const editFile = useAtomValue(editFileAtom)

  if (!editFile) {
    return <p>no file selected</p>
  }

  return (
    <Editor
      defaultLanguage="text"
      theme="vs-dark"
      defaultValue={editFile}
      key={editFile}
    />
  )
}
