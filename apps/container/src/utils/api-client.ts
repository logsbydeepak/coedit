'use client'

import { hc } from 'hono/client'

import { AppType as UserAPIType } from '@coedit/server'

import { env } from '#/env'

class ResponseError extends Error {
  response: Response
  constructor(message: string, res: Response) {
    super()
    this.message = message
    this.response = res
  }
}

export const apiClient = (token: string) =>
  hc<UserAPIType>(env.USER_API, {
    fetch: (input, requestInit, _Env, _executionCtx) =>
      fetch(input, {
        ...requestInit,
        credentials: 'include',
        headers: {
          Cookie: `x-auth=${token}`,
        },
      }).then((res) => {
        if (!res.ok) {
          throw new ResponseError(res.statusText, res)
        }

        return res
      }),
  })
