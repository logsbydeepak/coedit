'use client'

import React, { Component } from 'react'
import Image from 'next/image'
import Editor, { Monaco } from '@monaco-editor/react'
import * as Tabs from '@radix-ui/react-tabs'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { RefreshCcwIcon, XIcon } from 'lucide-react'
import { editor } from 'monaco-editor'
import ms from 'ms'
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

import { r } from '@coedit/r'

import { Status, StatusContainer } from './components'
import { editFileAtom } from './store'
import { apiClient, getExtensionIcon, tinyFetch } from './utils'

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
  txt: 'text',
  dockerfile: 'dockerfile',
  Dockerfile: 'dockerfile',
  yaml: 'yaml',
  nix: 'nix',
  astro: 'astro',
  toml: 'toml',
  mod: 'text',
  go: 'go',
}

export default function TextEditor() {
  const queryClient = useQueryClient()
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
    queryClient.removeQueries({
      queryKey: ['files', path],
    })
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
        className="size-full"
        value={activeTab || ''}
        onValueChange={(value) => setActiveTab(value)}
      >
        <Tabs.List className="no-scrollbar border-gray-3 flex h-8 items-center overflow-x-scroll border-b">
          {tabs.map((tab) => (
            <FileTab key={tab.path} tab={tab} onClose={handleCloseTab} />
          ))}
        </Tabs.List>

        {!activeTab && (
          <StatusContainer>
            <Status>no file selected</Status>
          </StatusContainer>
        )}

        {tabs.length !== 0 && (
          <div className="size-full">
            {tabs.map((tab) => (
              <Tabs.Content
                key={tab.path}
                value={tab.path}
                forceMount
                className="size-full data-[state=inactive]:hidden"
              >
                <TextEditorWrapper
                  filePath={tab.path}
                  portalNode={portalNode}
                  activeTab={activeTab}
                  monacoRef={monacoRef}
                />
              </Tabs.Content>
            ))}
          </div>
        )}
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
    </>
  )
}

function FileTab({ tab, onClose }: { tab: Tab; onClose: (path: Tab) => void }) {
  return (
    <div
      key={tab.path}
      className="group border-sage-9 hover:bg-gray-3 has-[>[aria-selected=true]]:bg-gray-4 flex h-full w-32 items-center justify-between has-[>[aria-selected=true]]:border-b-2"
    >
      <Tabs.Trigger
        value={tab.path}
        className="text-gray-11 hover:text-gray-12 aria-[selected=true]:text-gray-12 flex size-full items-center space-x-1 overflow-hidden pl-2 text-ellipsis"
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
        <p className="w-full overflow-hidden text-xs text-nowrap text-ellipsis">
          {tab.name}
        </p>
      </Tabs.Trigger>
      <button
        className="text-gray-11 hover:text-gray-12 flex size-7 shrink-0 items-center justify-center"
        onClick={() => onClose(tab)}
      >
        <XIcon className="hidden size-3 group-hover:block" />
      </button>
    </div>
  )
}

export function debounce<Args extends readonly unknown[]>(
  func: (...args: Args) => void | Promise<void>,
  wait: number
) {
  let timeout: ReturnType<typeof setTimeout> | undefined

  return (...args: Args): void => {
    if (timeout) clearTimeout(timeout)

    timeout = setTimeout(() => {
      void func(...args)
    }, wait)
  }
}

function TextEditorWrapper({
  filePath,
  portalNode,
  activeTab,
  monacoRef,
}: {
  filePath: string
  portalNode: HtmlPortalNode<Component>
  activeTab: string | null
  monacoRef: React.MutableRefObject<Monaco | null>
}) {
  const [isPending, startTransition] = React.useTransition()

  const isValidFile = React.useMemo(
    () => validFileExtensions(filePath),
    [filePath]
  )

  const { isLoading, isError, data, refetch, isFetching } = useQuery({
    queryFn: async () => {
      const baseURL = apiClient.content.$url().toString()
      const url = baseURL + filePath
      const res = await tinyFetch(url)

      if (res.status === 404) {
        return r('NOT_FOUND')
      }

      if (!res.ok) {
        throw new Error('Failed to fetch file')
      }
      const result = await res.text()

      monacoRef.current?.editor.getModels().forEach((model) => {
        if (model.uri.path === filePath) {
          model.setValue(result)
        }
      })

      return r('OK', { content: result })
    },
    enabled: isValidFile,
    queryKey: ['files', filePath],
    staleTime: Infinity,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  const handleOnChange = (value: string | undefined) => {
    if (!value) return

    const debounced = debounce(async (value: string) => {
      startTransition(async () => {
        try {
          const res = await apiClient.content.$post(
            {
              query: {
                path: filePath,
              },
            },
            {
              init: {
                body: value,
              },
            }
          )
          const resData = await res.json()

          if (resData.code === 'INVALID_PATH') {
            toast.error('file do not exists', {
              description: filePath,
            })
            return
          }

          if (resData.code !== 'OK') throw new Error('Failed to save file')
        } catch (error) {
          toast.error('Failed to save file', {
            description: filePath,
          })
        }
      })
    }, ms('1s'))
    debounced(value)
  }

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

  if (isError || !data) {
    return (
      <StatusContainer>
        <Status>error</Status>
      </StatusContainer>
    )
  }

  if (data.code === 'NOT_FOUND') {
    return (
      <StatusContainer>
        <Status>file not found</Status>
      </StatusContainer>
    )
  }

  return (
    <>
      <div className="flex w-full items-center justify-between space-x-6 px-2 py-1">
        <p className="text-gray-11 overflow-hidden text-xs text-nowrap text-ellipsis">
          {filePath}
        </p>
        <div className="flex shrink-0 items-center space-x-1">
          <div
            className="group flex size-6 items-center justify-center"
            data-state={isPending || isFetching}
          >
            <div className="bg-gray-7 size-3 rounded-full group-data-[state=false]:hidden group-data-[state=true]:animate-pulse" />
          </div>
          <button
            className="text-gray-11 hover:bg-sage-4 hover:text-gray-12 hover:ring-sage-9 flex size-6 items-center justify-center ring-inset hover:ring-1"
            onClick={() => refetch()}
          >
            <RefreshCcwIcon className="size-3" />
          </button>
        </div>
      </div>
      {activeTab === filePath && (
        <OutPortal
          node={portalNode}
          theme={theme.name}
          defaultLanguage={getLanguage(filePath)}
          path={filePath}
          onChange={handleOnChange}
          defaultValue={data.content}
        />
      )}
    </>
  )
}

const getLanguage = (name: string) => {
  const parts = name.split('.')
  const ext = parts[parts.length - 1]
  return languageMap[ext] || 'text'
}

const validFileExtensions = (name: string) => {
  const newName = name.split('/').pop()
  if (!newName) return false
  const parts = newName.split('.')
  const ext = parts[parts.length - 1]
  const language = languageMap[ext]
  if (language) return true

  return false
}
