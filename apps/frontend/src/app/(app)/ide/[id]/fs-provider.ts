'use client'

import type { URI } from '@codingame/monaco-vscode-api/vscode/vs/base/common/uri'
import {
  FileSystemProviderCapabilities,
  FileSystemProviderError,
  FileSystemProviderErrorCode,
  FileType,
  registerFileSystemOverlay,
  type IFileSystemProviderWithFileReadWriteCapability,
  type IStat,
} from '@codingame/monaco-vscode-files-service-override'
import * as monaco from 'monaco-editor'

import { basename, dirname, toWorkspaceRelativePath } from './store'
import { apiClient, tinyFetch } from './utils'

const noneEvent = () => ({ dispose() {} })

function notFound(resource: URI) {
  return FileSystemProviderError.create(
    `Unable to resolve nonexistent file '${resource.path}'`,
    FileSystemProviderErrorCode.FileNotFound
  )
}

function noPermissions(resource: URI) {
  return FileSystemProviderError.create(
    `'${resource.path}' is read-only in the browser`,
    FileSystemProviderErrorCode.NoPermissions
  )
}

async function listDirectory(path: string) {
  try {
    const res = await apiClient.explorer.$get({ query: { path } })
    const data = await res.json()
    return data.code === 'OK' ? data.files : null
  } catch {
    return null
  }
}

let registered = false

// Read-only FS overlay for WORKSPACE_ROOT via Monaco models + container HTTP.
export function registerWorkspaceFileSystemProvider() {
  if (registered) return
  registered = true

  const provider: IFileSystemProviderWithFileReadWriteCapability = {
    capabilities:
      FileSystemProviderCapabilities.FileReadWrite |
      FileSystemProviderCapabilities.PathCaseSensitive |
      FileSystemProviderCapabilities.Readonly,
    onDidChangeCapabilities: noneEvent,
    onDidChangeFile: noneEvent,
    watch: () => ({ dispose() {} }),

    async stat(resource): Promise<IStat> {
      const rel = toWorkspaceRelativePath(resource.path)
      if (rel === null) throw notFound(resource)

      if (rel === '/') {
        return { type: FileType.Directory, ctime: 0, mtime: 0, size: 0 }
      }

      const files = await listDirectory(dirname(rel))
      const entry = files?.find((file) => file.name === basename(rel))

      if (!entry) throw notFound(resource)

      return {
        type: entry.isDirectory ? FileType.Directory : FileType.File,
        ctime: 0,
        mtime: 0,
        size: 0,
      }
    },

    async readdir(resource) {
      const rel = toWorkspaceRelativePath(resource.path)
      if (rel === null) throw notFound(resource)

      const files = await listDirectory(rel)
      if (!files) throw notFound(resource)

      return files.map(
        (file) =>
          [
            file.name,
            file.isDirectory ? FileType.Directory : FileType.File,
          ] as [string, FileType]
      )
    },

    async readFile(resource) {
      const model = monaco.editor
        .getModels()
        .find((m) => m.uri.path === resource.path)
      if (model) {
        return new TextEncoder().encode(model.getValue())
      }

      const rel = toWorkspaceRelativePath(resource.path)
      if (rel === null) throw notFound(resource)

      const url = apiClient.content.$url().toString() + rel
      const res = await tinyFetch(url).catch(() => null)
      if (!res) throw notFound(resource)

      return new Uint8Array(await res.arrayBuffer())
    },

    async writeFile(resource) {
      throw noPermissions(resource)
    },
    async mkdir(resource) {
      throw noPermissions(resource)
    },
    async delete(resource) {
      throw noPermissions(resource)
    },
    async rename(_from, to) {
      throw noPermissions(to)
    },
  }

  registerFileSystemOverlay(1, provider)
}
