'use client'

import React from 'react'
import Editor from '@monaco-editor/react'
import { useQuery } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'

import { editFileAtom, publicIPAtom } from '../store'

export default function TextEditor() {
  const editFile = useAtomValue(editFileAtom)
  const publicIP = useAtomValue(publicIPAtom)

  const { isLoading, isError, data } = useQuery({
    queryFn: async () => {
      if (!editFile) return
      const file = editFile.startsWith('/') ? editFile.slice(1) : editFile
      const res = await fetch(`http://${publicIP}/api/workspace/${file}`, {
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('failed to fetch file')
      }

      return await res.text()
    },
    queryKey: [editFile],
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  if (!editFile) {
    return <p>no file selected</p>
  }

  if (isLoading) {
    return <p>loading...</p>
  }

  if (isError || !data) {
    return <p>error</p>
  }

  return (
    <Editor
      defaultLanguage="text"
      theme="vs-dark"
      defaultValue={data}
      path={editFile}
    />
  )
}
