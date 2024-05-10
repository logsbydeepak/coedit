'use client'

import React, { Component } from 'react'
import Editor, { Monaco, useMonaco } from '@monaco-editor/react'
import { useQuery } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { LoaderIcon, RefreshCcwIcon } from 'lucide-react'
import {
  createHtmlPortalNode,
  HtmlPortalNode,
  InPortal,
  OutPortal,
} from 'react-reverse-portal'
import { toast } from 'sonner'

import { editFileAtom, publicIPAtom } from '../store'
import { apiClient } from './utils'

export default function TextEditor() {
  const portalNode = React.useMemo(
    () =>
      createHtmlPortalNode({
        attributes: { class: 'h-full' },
      }),
    []
  )

  function handleEditorDidMount(editor: any, monaco: Monaco) {
    monaco.editor.defineTheme('my', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {},
    })
  }

  return (
    <>
      <InPortal node={portalNode}>
        <Editor
          onMount={handleEditorDidMount}
          options={{
            fontSize: 13,
            fontFamily: 'var(--font-geist-mono)',
          }}
        />
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

  const { isLoading, isError, data, refetch } = useQuery({
    queryFn: async () => {
      if (!editFile) return
      const file = editFile.startsWith('/') ? editFile.slice(1) : editFile
      const res = await fetch(`http://${publicIP}/api/workspace/${file}`, {
        credentials: 'include',
      })
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

  if (isError) {
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

  let timeout: Timer
  const handleOnChange = (value: string | undefined) => {
    if (!value) return
    function debounce(func: Function, wait: number) {
      return function (this: any, ...args: any[]) {
        const context = this
        clearTimeout(timeout)
        timeout = setTimeout(() => func.apply(context, args), wait)
      }
    }

    const debounced = debounce(async (value: string) => {
      try {
        const res = await apiClient(publicIP).fileExplorer.update.$post({
          json: {
            path: editFile,
            body: value,
          },
        })
        const resData = await res.json()
        if (resData.code !== 'OK') throw new Error('Failed to save file')
      } catch (error) {
        toast.error('Failed to save file', {
          description: editFile,
        })
      }
    }, 2000)
    debounced(value)
  }

  return (
    <>
      <div className="flex items-center justify-between px-2 py-1">
        <p className="text-xs text-gray-11">{editFile}</p>
        <button
          className="flex size-6 items-center justify-center text-gray-11 ring-inset hover:bg-sage-4 hover:text-gray-12 hover:ring-1 hover:ring-sage-9"
          onClick={() => refetch()}
        >
          <RefreshCcwIcon className="size-3" />
        </button>
      </div>
      <OutPortal
        node={portalNode}
        defaultLanguage={language}
        theme="my"
        path={editFile}
        onChange={handleOnChange}
        value={data}
      />
    </>
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
      'txt',
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
