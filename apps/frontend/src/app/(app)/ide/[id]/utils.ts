'use client'

import { hc } from 'hono/client'

import type { AppType } from '@coedit/container'

import { ResponseError } from '#/utils/error'

export const apiClient = (url: string) =>
  hc<AppType>(`http://${url}`, {
    fetch: (input, requestInit, Env, executionCtx) =>
      fetch(input, {
        ...requestInit,
        credentials: 'include',
      }).then((res) => {
        if (!res.ok) {
          throw new ResponseError(res.statusText, res)
        }

        return res
      }),
  }).api
