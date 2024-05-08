'use client'

import React, { Component } from 'react'
import Editor from '@monaco-editor/react'
import { useQuery } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { LoaderIcon } from 'lucide-react'
import {
  createHtmlPortalNode,
  HtmlPortalNode,
  InPortal,
  OutPortal,
} from 'react-reverse-portal'

import { editFileAtom, publicIPAtom } from '../store'

export default function TextEditor() {
  const portalNode = React.useMemo(
    () =>
      createHtmlPortalNode({
        attributes: { class: 'h-full' },
      }),
    []
  )

  return (
    <>
      <InPortal node={portalNode}>
        <Editor />
      </InPortal>
      <TextEditorWrapper portalNode={portalNode} />
    </>
  )
}

function TextEditorWrapper({
  portalNode,
}: {
  portalNode: HtmlPortalNode<Component<any>>
}) {
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
    return (
      <Container>
        <Status>no file selected</Status>
      </Container>
    )
  }

  if (isLoading) {
    return (
      <Container>
        <Status isLoading>loading</Status>
      </Container>
    )
  }

  if (isError || !data) {
    return (
      <Container>
        <Status>error</Status>
      </Container>
    )
  }

  if (!canFileBeEdited(editFile)) {
    return (
      <Container>
        <Status>not supported</Status>
      </Container>
    )
  }

  const language = getLanguage(editFile)

  return (
    <OutPortal
      node={portalNode}
      defaultLanguage={language}
      theme="vs-dark"
      defaultValue={data}
      path={editFile}
    />
  )
}

const getLanguage = (name: string) => {
  const parts = name.split('.')
  const ext = parts[parts.length - 1]

  if (['ts', 'tsx'].includes(ext)) return 'typescript'
  if (['js', 'jsx', 'mjs'].includes(ext)) return 'javascript'
  if (['html', 'svg'].includes(ext)) return 'html'
  if (['css'].includes(ext)) return 'css'
  if (['json'].includes(ext)) return 'json'
  if (['md'].includes(ext)) return 'markdown'
  if (['rs'].includes(ext)) return 'rust'
  return 'text'
}

const canFileBeEdited = (name: string) => {
  const parts = name.split('.')
  const ext = parts[parts.length - 1]

  if (
    [
      'ts',
      'tsx',
      'js',
      'jsx',
      'mjs',
      'html',
      'css',
      'json',
      'md',
      'rs',
      'gitignore',
      'svg',
    ].includes(ext)
  ) {
    return true
  }

  return false
}

function Container({ children }: React.HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <div className="flex size-full items-center justify-center pt-14 text-center">
      {children}
    </div>
  )
}

function Status({
  children,
  isLoading = false,
}: React.PropsWithChildren<{ isLoading?: boolean }>) {
  return (
    <div className="flex items-center space-x-1 rounded-full bg-gray-5 px-3 py-1 font-mono text-xs">
      {isLoading && <LoaderIcon className="size-3 animate-spin text-gray-11" />}
      <p>{children}</p>
    </div>
  )
}
