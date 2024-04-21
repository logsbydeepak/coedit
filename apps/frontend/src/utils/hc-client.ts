'use client'

import { hc } from 'hono/client'

import type { AppType } from '@coedit/server'

import { env } from '#/env'

export const apiClient = hc<AppType>(env.NEXT_PUBLIC_API_URL, {
  fetch: (input, requestInit, Env, executionCtx) =>
    fetch(input, {
      ...requestInit,
      credentials: 'include',
    }).then((res) => {
      if (res.status === 401) {
        window.dispatchEvent(new CustomEvent('UNAUTHORIZED'))
      }

      return res
    }),
})
