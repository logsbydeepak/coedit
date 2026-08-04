'use client'

import { LogLevel } from '@codingame/monaco-vscode-api'
import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import {
  LanguageClientWrapper,
  type LanguageClientConfig,
} from 'monaco-languageclient/lcwrapper'
import {
  MonacoVscodeApiWrapper,
  type MonacoVscodeApiConfig,
} from 'monaco-languageclient/vscodeApiWrapper'
import {
  // Not a React hook — renamed so eslint-plugin-react-hooks ignores it.
  useWorkerFactory as configureWorkerLoaders,
  Worker as MlcWorker,
} from 'monaco-languageclient/workerFactory'
import { toast } from 'sonner'
import * as vscode from 'vscode'

import { registerWorkspaceFileSystemProvider } from './fs-provider'
import { openEditor } from './open-editor'
import { containerURL, getToken, WORKSPACE_ROOT } from './store'

// Monaco language id → container `/lsp/:language` server key.
const SERVER_FOR_LANGUAGE: Record<string, string> = {
  typescript: 'typescript',
  javascript: 'typescript',
  tsx: 'typescript',
  jsx: 'typescript',
  go: 'go',
  rust: 'rust',
}

const SERVER_DOCUMENT_SELECTOR = Object.entries(SERVER_FOR_LANGUAGE).reduce<
  Record<string, string[]>
>((acc, [languageId, server]) => {
  ;(acc[server] ??= []).push(languageId)
  return acc
}, {})

let apiWrapperStart: Promise<void> | null = null

// Workers are pre-bundled (scripts/build-workers.ts); Turbopack can't bundle
// monaco-languageclient's default `new Worker(new URL(...))` loaders.
function configurePrebuiltWorkerFactory(
  logger: Parameters<typeof configureWorkerLoaders>[0]['logger']
) {
  configureWorkerLoaders({
    logger,
    workerLoaders: {
      editorWorkerService: () =>
        new MlcWorker('/workers/editor.worker.js', { type: 'module' }),
      extensionHostWorkerMain: () =>
        new MlcWorker('/workers/extensionHost.worker.js', { type: 'module' }),
      TextMateWorker: () =>
        new MlcWorker('/workers/textmate.worker.js', { type: 'module' }),
    },
  })
}

export function ensureVscodeApi() {
  if (!apiWrapperStart) {
    loader.config({ monaco })

    const config: MonacoVscodeApiConfig = {
      $type: 'classic',
      viewsConfig: { $type: 'EditorService', openEditorFunc: openEditor },
      logLevel: LogLevel.Off,
      monacoWorkerFactory: configurePrebuiltWorkerFactory,
    }

    apiWrapperStart = new MonacoVscodeApiWrapper(config).start().then(() => {
      registerWorkspaceFileSystemProvider()
    })
  }
  return apiWrapperStart
}

const clients = new Map<string, Promise<LanguageClientWrapper>>()

function lspSocketUrl(server: string) {
  const url = new URL(`${containerURL().api}/lsp/${server}`)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.searchParams.set('x-auth', getToken())
  return url.toString()
}

async function startClient(server: string) {
  await ensureVscodeApi()

  const config: LanguageClientConfig = {
    languageId: server,
    connection: {
      options: {
        $type: 'WebSocketUrl',
        url: lspSocketUrl(server),
      },
    },
    clientOptions: {
      documentSelector: SERVER_DOCUMENT_SELECTOR[server] ?? [server],
      workspaceFolder: {
        index: 0,
        name: 'workspace',
        uri: vscode.Uri.file(WORKSPACE_ROOT),
      },
    },
  }

  const wrapper = new LanguageClientWrapper(config)
  await wrapper.start()
  return wrapper
}

export function ensureLanguageClient(languageId: string) {
  const server = SERVER_FOR_LANGUAGE[languageId]
  if (!server) return

  if (!clients.has(server)) {
    clients.set(
      server,
      startClient(server).catch((error: unknown) => {
        clients.delete(server)
        toast.error(`Failed to start ${server} language server`)
        throw error
      })
    )
  }

  return clients.get(server)
}
