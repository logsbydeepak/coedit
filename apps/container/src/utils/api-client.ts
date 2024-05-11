'use client'

import { hc } from 'hono/client'

import { AppType as UserAPIType } from '@coedit/server'

import { env } from '#/env'

import { emitStop } from './lifecycle'

export class ResponseError extends Error {
  response: Response
  constructor(message: string, res: Response) {
    super()
    this.message = message
    this.response = res
  }
}

export const apiClient = (token: string) =>
  hc<UserAPIType>(env.USER_API, {
    fetch: (input, requestInit, Env, executionCtx) =>
      fetch(input, {
        ...requestInit,
        credentials: 'include',
        headers: {
          Cookie: `x-auth=${token}`,
        },
      }).then((res) => {
        if (res.status === 401) {
          emitStop()
        }

        if (!res.ok) {
          throw new ResponseError(res.statusText, res)
        }

        return res
      }),
  })
