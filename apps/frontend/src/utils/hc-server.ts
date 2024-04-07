import 'server-only'

import { cookies } from 'next/headers'
import { hc } from 'hono/client'

import type { AppType } from '@coedit/server'

import { env } from '#/env'

export const apiClient = hc<AppType>(env.NEXT_PUBLIC_API_URL, {
  fetch: (input, requestInit, Env, executionCtx) =>
    fetch(input, {
      ...requestInit,
      credentials: 'include',
      headers: {
        ...requestInit?.headers,
        Cookie: `x-auth=${cookies().get('x-auth')?.value}`,
      },
    }),
})
