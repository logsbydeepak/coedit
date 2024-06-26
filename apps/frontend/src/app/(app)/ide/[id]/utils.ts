'use client'

import { hc } from 'hono/client'

import type { AppType } from '@coedit/container'

import { ResponseError } from '#/utils/error'
import extensionConfig from '#/utils/symbol-icon-theme.json'

import { containerURL, getToken } from './store'

export const tinyFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
) => {
  const headers = new Headers(init?.headers)
  headers.set('x-auth', getToken())

  const newRequestInit: RequestInit = {
    ...init,
    headers,
  }

  return fetch(input, newRequestInit).then((res) => {
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('UNAUTHORIZED'))
    }

    if (!res.ok) {
      throw new ResponseError(res.statusText, res)
    }

    return res
  })
}

export const apiClient = hc<AppType>(containerURL().api, {
  fetch: (input, requestInit, _, __) => tinyFetch(input, requestInit),
})

export function getExtensionIcon({
  name,
  isDirectory,
}: {
  name: string
  isDirectory: boolean
}) {
  const data = extensionConfig as {
    iconDefinitions: {
      [key: string]: { iconPath: string }
    }
    fileExtensions: {
      [key: string]: string
    }
    fileNames: {
      [key: string]: string
    }
    languageIds: {
      [key: string]: string
    }
    folderNames: {
      [key: string]: string
    }
    file: string
    folder: string
  }

  const defaultFileIcon = data.iconDefinitions[data.file].iconPath
  const defaultFolderIcon = data.iconDefinitions[data.folder].iconPath

  let result = ''

  if (isDirectory) {
    const icon = data.folderNames[name]
    result = data.iconDefinitions[icon]?.iconPath
  } else {
    const ext = name.split('.').pop() || ''

    if (data.fileNames[name]) {
      result = data.iconDefinitions[data.fileNames[name]]?.iconPath
    }

    if (data.fileExtensions[ext]) {
      result = data.iconDefinitions[data.fileExtensions[ext]]?.iconPath
    }
  }

  if (!result) {
    result = isDirectory ? defaultFolderIcon : defaultFileIcon
  }

  return ('/' + result.replace('./', '')) as string
}
