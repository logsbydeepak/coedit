'use client'

import React, { Component } from 'react'
import Image from 'next/image'
import Editor, { Monaco } from '@monaco-editor/react'
import * as Tabs from '@radix-ui/react-tabs'
import { useQuery } from '@tanstack/react-query'
import { useAtom, useAtomValue } from 'jotai'
import { LoaderIcon, RefreshCcwIcon, XIcon } from 'lucide-react'
import { editor } from 'monaco-editor'
import {
  createHtmlPortalNode,
  HtmlPortalNode,
  InPortal,
  OutPortal,
} from 'react-reverse-portal'
import { toast } from 'sonner'

import { editFileAtom, publicIPAtom } from '../store'
import { getExtensionIcon } from './extension'
import { apiClient } from './utils'

type Tab = {
  name: string
  path: string
}

export default function TextEditor() {
  const [filePath, setFilePath] = useAtom(editFileAtom)

  const [activeTab, setActiveTab] = React.useState<string | null>('')
  const [tabs, setTabs] = React.useState<Tab[]>([])

  const editorRef = React.useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = React.useRef<Monaco | null>(null)

  const portalNode = React.useMemo(
    () =>
      createHtmlPortalNode({
        attributes: { class: 'h-full' },
      }),
    []
  )

  React.useEffect(() => {
    if (!filePath) return setFilePath(null)
    const findTab = tabs.find((tab) => tab.path === filePath.path)
    if (findTab) {
      setActiveTab(findTab.path)
      setFilePath(null)
    } else {
      if (tabs.length >= 5) {
        toast.error('max tabs reached')
        setFilePath(null)
        return
      }
      setTabs((prev) => [
        ...prev,
        {
          name: filePath.name,
          path: filePath.path,
        },
      ])
      setActiveTab(filePath.path)
      setFilePath(null)
    }
  }, [filePath, tabs, setFilePath])

  const closeTab = (path: string) => {
    const index = tabs.findIndex((tab) => tab.path === path)
    if (index === -1) return

    if (activeTab === path) {
      const nextIndex = index === 0 ? 1 : index - 1
      const nextTab = tabs[nextIndex]
      setActiveTab(nextTab ? nextTab.path : null)
    }

    monacoRef.current?.editor.getModels().forEach((model) => {
      if (model.uri.path === path) {
        model.dispose()
      }
    })

    setTabs((prev) => prev.filter((tab) => tab.path !== path))
  }

  async function handleEditorDidMount(
    editor: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) {
    editorRef.current = editor
    monacoRef.current = monaco

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    })
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowNonTsExtensions: true,
      allowJs: true,
      target: monaco.languages.typescript.ScriptTarget.Latest,
    })

    monaco.editor.defineTheme('my', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {},
    })
  }

  return (
    <>
      <Tabs.Root
        className="flex flex-col"
        value={activeTab || ''}
        onValueChange={(value) => setActiveTab(value)}
      >
        <Tabs.List className="no-scrollbar flex h-8 items-center overflow-x-scroll border-b border-gray-3">
          {tabs.map((tab) => (
            <div
              key={tab.path}
              className="group flex h-full w-32 items-center justify-between border-sage-9 hover:bg-gray-3 has-[>[aria-selected=true]]:border-b-2 has-[>[aria-selected=true]]:bg-gray-4"
            >
              <Tabs.Trigger
                value={tab.path}
                className="flex h-full items-center space-x-1 overflow-hidden text-ellipsis pl-2 text-gray-11 hover:text-gray-12 aria-[selected=true]:text-gray-12"
              >
                <Image
                  src={getExtensionIcon({
                    name: tab.name,
                    isDirectory: false,
                  })}
                  alt={tab.path}
                  width="14"
                  height="14"
                />
                <p className="w-full overflow-hidden text-ellipsis text-nowrap text-xs">
                  {tab.name}
                </p>
              </Tabs.Trigger>
              <button
                className="flex size-7 shrink-0 items-center justify-center text-gray-11 hover:text-gray-12"
                onClick={() => closeTab(tab.path)}
              >
                <XIcon className="hidden size-3 group-hover:block" />
              </button>
            </div>
          ))}
        </Tabs.List>
      </Tabs.Root>
      <InPortal node={portalNode}>
        <Editor
          onMount={handleEditorDidMount}
          options={{
            fontSize: 13,
            fontFamily: 'var(--font-geist-mono)',
            minimap: {
              enabled: false,
            },
            folding: false,
          }}
        />
      </InPortal>

      {!activeTab && (
        <Container>
          <Status>no file selected</Status>
        </Container>
      )}

      {activeTab && (
        <TextEditorWrapper
          filePath={activeTab}
          portalNode={portalNode}
          editorRef={editorRef}
          monacoRef={monacoRef}
        />
      )}
    </>
  )
}

function TextEditorWrapper({
  filePath,
  portalNode,
  editorRef,
  monacoRef,
}: {
  filePath: string
  portalNode: HtmlPortalNode<Component<any>>
  editorRef: React.MutableRefObject<editor.IStandaloneCodeEditor | null>
  monacoRef: React.MutableRefObject<Monaco | null>
}) {
  const publicIP = useAtomValue(publicIPAtom)

  const { isLoading, isError, data, refetch } = useQuery({
    queryFn: async () => {
      const res = await fetch(`http://${publicIP}/api/content${filePath}`, {
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Failed to fetch file')
      }

      return await res.text()
    },
    staleTime: 30000000,
    queryKey: [filePath],
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  if (!filePath) {
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

  if (!canFileBeEdited(filePath)) {
    return (
      <Container>
        <Status>not supported</Status>
      </Container>
    )
  }

  const language = getLanguage(filePath)

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
        const res = await apiClient(publicIP).content.$post({
          json: {
            path: filePath,
            body: value,
          },
        })
        const resData = await res.json()
        if (resData.code !== 'OK') throw new Error('Failed to save file')
      } catch (error) {
        toast.error('Failed to save file', {
          description: filePath,
        })
      }
    }, 2000)
    debounced(value)
  }

  return (
    <>
      <div className="flex items-center justify-between px-2 py-1">
        <p className="text-xs text-gray-11">{filePath}</p>
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
        path={filePath}
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
