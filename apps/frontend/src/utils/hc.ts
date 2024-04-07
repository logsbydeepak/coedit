import { hc } from 'hono/client'

import type { AppType } from '@coedit/server'

import { env } from '#/env'

export const apiClient = hc<AppType>(env.NEXT_PUBLIC_API_URL, {
  fetch: (input, requestInit, Env, executionCtx) =>
    fetch(input, {
      ...requestInit,
      credentials: 'include',
    }),
})

export const serverClient = (authToken: string) =>
  hc<AppType>(env.NEXT_PUBLIC_API_URL, {
    fetch: (input, requestInit, Env, executionCtx) =>
      fetch(input, {
        ...requestInit,
        credentials: 'include',
        headers: {
          ...requestInit?.headers,
          Cookie: `x-auth=${authToken}`,
        },
      }),
  })
