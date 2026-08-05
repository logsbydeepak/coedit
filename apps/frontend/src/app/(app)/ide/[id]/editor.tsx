'use client'

import React, { Component } from 'react'
import Image from 'next/image'
import Editor, { Monaco } from '@monaco-editor/react'
import * as Tabs from '@radix-ui/react-tabs'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { RefreshCcwIcon } from 'lucide-react'
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
import { ensureLanguageClient, ensureVscodeApi } from './lsp'
import { activeEditorRef, editFileAtom, toFileUri } from './store'
import { TabItem } from './tab-item'
import { useScrollActiveTabIntoView } from './use-tab-scroll'
import { apiClient, getExtensionIcon, tinyFetch } from './utils'

type Tab = {
  name: string
  path: string
  isDirty: boolean
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

  const [activeTab, setActiveTab] = React.useState<string | null>(null)
  const [tabs, setTabs] = React.useState<Tab[]>([])

  const monacoRef = React.useRef<Monaco | null>(null)
  const { registerTabRef, unregisterTabRef } =
    useScrollActiveTabIntoView(activeTab)

  const [isVscodeApiReady, setIsVscodeApiReady] = React.useState(false)

  React.useEffect(() => {
    ensureVscodeApi().then(() => setIsVscodeApiReady(true))
  }, [])

  const portalNode = React.useMemo(
    () =>
      createHtmlPortalNode({
        attributes: { class: 'h-full' },
      }),
    []
  )

  React.useEffect(() => {
    if (!filePath) return

    const existing = tabs.find((tab) => tab.path === filePath.path)
    if (existing) {
      setActiveTab(existing.path)
      setFilePath(null)
      return
    }

    setTabs((prev) => [
      ...prev,
      {
        name: filePath.name,
        path: filePath.path,
        isDirty: false,
      },
    ])
    setActiveTab(filePath.path)
    setFilePath(null)
  }, [filePath, tabs, setFilePath])

  const handleCloseTab = (tab: Tab) => {
    const { path } = tab
    const index = tabs.findIndex((t) => t.path === path)
    if (index === -1) return

    if (activeTab === path) {
      const nextTab = tabs[index === 0 ? 1 : index - 1]
      setActiveTab(nextTab ? nextTab.path : null)
    }

    // Keep the monaco model — disposing breaks go-to-definition refs.
    unregisterTabRef(path)
    setTabs((prev) => prev.filter((t) => t.path !== path))
    queryClient.removeQueries({ queryKey: ['files', path] })
  }

  const handleDirtyChange = React.useCallback(
    (path: string, isDirty: boolean) => {
      setTabs((prev) =>
        prev.map((tab) =>
          tab.path === path && tab.isDirty !== isDirty
            ? { ...tab, isDirty }
            : tab
        )
      )
    },
    []
  )

  async function handleEditorDidMount(
    editorInstance: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) {
    monacoRef.current = monaco
    activeEditorRef.current = editorInstance

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
        className="flex size-full flex-col overflow-hidden"
        value={activeTab ?? ''}
        onValueChange={(value) => setActiveTab(value)}
      >
        <Tabs.List className="no-scrollbar flex h-8 shrink-0 items-center overflow-x-scroll border-b border-gray-3">
          {tabs.map((tab) => (
            <FileTab
              key={tab.path}
              tab={tab}
              onClose={handleCloseTab}
              ref={registerTabRef(tab.path)}
            />
          ))}
        </Tabs.List>

        {!activeTab && (
          <StatusContainer>
            <Status>no file selected</Status>
          </StatusContainer>
        )}

        {tabs.length !== 0 && (
          <div className="min-h-0 flex-1">
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
                  onDirtyChange={handleDirtyChange}
                />
              </Tabs.Content>
            ))}
          </div>
        )}
      </Tabs.Root>

      <InPortal node={portalNode}>
        {isVscodeApiReady && (
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
        )}
      </InPortal>
    </>
  )
}

const FileTab = React.forwardRef<
  HTMLDivElement,
  { tab: Tab; onClose: (tab: Tab) => void }
>(function FileTab({ tab, onClose }, ref) {
  return (
    <TabItem
      ref={ref}
      value={tab.path}
      onClose={() => onClose(tab)}
      closeLabel={`Close ${tab.name}`}
      isDirty={tab.isDirty}
      className="w-36"
    >
      <Image
        src={getExtensionIcon({
          name: tab.name,
          isDirectory: false,
        })}
        alt=""
        width="14"
        height="14"
        className="shrink-0"
      />
      <p className="min-w-0 flex-1 overflow-hidden text-xs text-nowrap text-ellipsis">
        {tab.name}
      </p>
    </TabItem>
  )
})

function TextEditorWrapper({
  filePath,
  portalNode,
  activeTab,
  onDirtyChange,
}: {
  filePath: string
  portalNode: HtmlPortalNode<Component<Record<string, unknown>>>
  activeTab: string | null
  onDirtyChange: (path: string, isDirty: boolean) => void
}) {
  const [isPending, startTransition] = React.useTransition()

  const isValidFile = React.useMemo(
    () => validFileExtensions(filePath),
    [filePath]
  )

  React.useEffect(() => {
    if (!isValidFile) return
    ensureLanguageClient(getLanguage(filePath))
  }, [filePath, isValidFile])

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

  const saveTimeout = React.useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleOnChange = (value: string | undefined) => {
    onDirtyChange(filePath, true)

    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
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
                body: value ?? '',
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
          onDirtyChange(filePath, false)
        } catch (error) {
          toast.error('Failed to save file', {
            description: filePath,
          })
        }
      })
    }, ms('1s'))
  }

  if (!isValidFile) {
    return (
      <StatusContainer>
        <Status>not supported</Status>
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
    <div className="flex size-full flex-col overflow-hidden">
      <div className="flex w-full shrink-0 items-center justify-between space-x-6 px-2 py-0.5">
        <p className="overflow-hidden text-xs text-nowrap text-ellipsis text-gray-11">
          {filePath}
        </p>
        <div className="flex shrink-0 items-center space-x-1">
          <div
            className="group flex size-6 items-center justify-center"
            data-state={isPending || isFetching}
          >
            <div className="size-3 rounded-full bg-gray-7 group-data-[state=false]:hidden group-data-[state=true]:animate-pulse" />
          </div>
          <button
            className="flex size-6 items-center justify-center text-gray-11 ring-inset hover:bg-sage-4 hover:text-gray-12 hover:ring-1 hover:ring-sage-9"
            onClick={() => refetch()}
          >
            <RefreshCcwIcon className="size-3" />
          </button>
        </div>
      </div>
      {activeTab === filePath && (
        <div className="min-h-0 flex-1">
          <OutPortal
            node={portalNode}
            theme={theme.name}
            defaultLanguage={getLanguage(filePath)}
            path={toFileUri(filePath)}
            onChange={handleOnChange}
            defaultValue={data.content}
          />
        </div>
      )}
    </div>
  )
}

const getLanguage = (name: string) => {
  const ext = name.split('.').pop()
  return (ext && languageMap[ext]) || 'text'
}

const validFileExtensions = (name: string) => {
  const ext = name.split('/').pop()?.split('.').pop()
  return Boolean(ext && languageMap[ext])
}
