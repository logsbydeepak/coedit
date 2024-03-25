'use client'

import Editor from '@monaco-editor/react'

export default function TextEdit() {
  return (
    <>
      <Editor height="90vh" defaultLanguage="typescript" />
    </>
  )
}
