import 'server-only'

import { cookies } from 'next/headers'
import { hc } from 'hono/client'

import type { AppType } from '@coedit/server'

import { env } from '#/env'

import { ResponseError } from './error'

export const apiClient = hc<AppType>(env.NEXT_PUBLIC_API_URL, {
  fetch: async (input, requestInit, _, __) => {
    const headers = new Headers(requestInit?.headers)
    headers.set('cookie', 'x-auth=' + cookies().get('x-auth')?.value)

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
