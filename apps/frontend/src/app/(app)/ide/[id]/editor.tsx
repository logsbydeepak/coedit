'use client'

import React, { Component } from 'react'
import Image from 'next/image'
import Editor, { Monaco } from '@monaco-editor/react'
import * as Tabs from '@radix-ui/react-tabs'
import { useQuery } from '@tanstack/react-query'
import { useAtom, useAtomValue } from 'jotai'
import { RefreshCcwIcon, XIcon } from 'lucide-react'
import { editor } from 'monaco-editor'
import {
  createHtmlPortalNode,
  HtmlPortalNode,
  InPortal,
  OutPortal,
} from 'react-reverse-portal'
import { BundledLanguage, getHighlighter } from 'shikiji'
import { shikijiToMonaco } from 'shikiji-monaco'
import theme from 'shikiji/themes/vitesse-dark.mjs'
import { toast } from 'sonner'

import { Status, StatusContainer } from './components'
import { editFileAtom, publicIPAtom } from './store'
import { apiClient, getExtensionIcon } from './utils'

type Tab = {
  name: string
  path: string
}

const languageMap: Record<string, BundledLanguage | 'text'> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  mjs: 'javascript',
  html: 'html',
  css: 'css',
  json: 'json',
  md: 'markdown',
  rs: 'rust',
  svg: 'html',
  gitignore: 'text',
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

  const handleCloseTab = (tab: Tab) => {
    const { path } = tab
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

    const langs: BundledLanguage[] = []
    Object.entries(languageMap).forEach(([_, lang]) => {
      if (lang === 'text') return
      monaco.languages.register({ id: lang })
      langs.push(lang)
    })

    const highlighter = await getHighlighter({
      themes: [theme],
      langs,
    })

    shikijiToMonaco(highlighter, monaco)
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
            <FileTab key={tab.path} tab={tab} onClose={handleCloseTab} />
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
        <StatusContainer>
          <Status>no file selected</Status>
        </StatusContainer>
      )}

      {activeTab && (
        <TextEditorWrapper filePath={activeTab} portalNode={portalNode} />
      )}
    </>
  )
}

function FileTab({ tab, onClose }: { tab: Tab; onClose: (path: Tab) => void }) {
  return (
    <div
      key={tab.path}
      className="group flex h-full w-32 items-center justify-between border-sage-9 hover:bg-gray-3 has-[>[aria-selected=true]]:border-b-2 has-[>[aria-selected=true]]:bg-gray-4"
    >
      <Tabs.Trigger
        value={tab.path}
        className="flex size-full items-center space-x-1 overflow-hidden text-ellipsis pl-2 text-gray-11 hover:text-gray-12 aria-[selected=true]:text-gray-12"
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
        onClick={() => onClose(tab)}
      >
        <XIcon className="hidden size-3 group-hover:block" />
      </button>
    </div>
  )
}

function TextEditorWrapper({
  filePath,
  portalNode,
}: {
  filePath: string
  portalNode: HtmlPortalNode<Component<any>>
}) {
  const publicIP = useAtomValue(publicIPAtom)

  const isValidFile = React.useMemo(
    () => validFileExtensions(filePath),
    [filePath]
  )

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
    enabled: isValidFile,
    staleTime: 30000000,
    queryKey: [filePath],
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  if (!isValidFile) {
    return (
      <StatusContainer>
        <Status>not supported</Status>
      </StatusContainer>
    )
  }

  if (!filePath) {
    return (
      <StatusContainer>
        <Status>no file selected</Status>
      </StatusContainer>
    )
  }

  if (isLoading) {
    return (
      <StatusContainer>
        <Status isLoading>loading</Status>
      </StatusContainer>
    )
  }

  if (isError) {
    return (
      <StatusContainer>
        <Status>error</Status>
      </StatusContainer>
    )
  }

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

  const language = getLanguage(filePath)

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
        theme={theme.name}
        defaultLanguage={language}
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
  return languageMap[ext] || 'text'
}

const validFileExtensions = (name: string) => {
  const parts = name.split('.')
  const ext = parts[parts.length - 1]

  const language = languageMap[ext]
  if (language) return true
  return false
}
