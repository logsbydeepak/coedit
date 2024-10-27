import 'server-only'

import { cookies } from 'next/headers'
import { hc } from 'hono/client'

import type { AppType } from '@coedit/server'

import { env } from '#/env'

import { ResponseError } from './error'

const TOKEN_KEY = 'x-auth'

export const apiClient = hc<AppType>(env.NEXT_PUBLIC_API_URL, {
  fetch: async (input, requestInit, _, __) => {
    const headers = new Headers(requestInit?.headers)
    const cookieStore = await cookies()
    const token = cookieStore.get(TOKEN_KEY)?.value || ''
    cookieStore.set(TOKEN_KEY, token)

    const newRequestInit: RequestInit = {
      ...requestInit,
      headers,
    }

    return fetch(input, newRequestInit).then((res) => {
      if (!res.ok) {
        throw new ResponseError(res.statusText, res)
      }

      return res
    })
  },
})
