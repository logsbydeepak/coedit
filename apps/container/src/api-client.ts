'use client'

import { hc } from 'hono/client'

import { AppType as ContainerAPIType } from '@coedit/container-api'
import { AppType as UserAPIType } from '@coedit/server'

import { ENV } from '#/env'

export class ResponseError extends Error {
  response: Response
  constructor(message: string, res: Response) {
    super()
    this.message = message
    this.response = res
  }
}

export const userClient = hc<UserAPIType>(ENV.USER_API, {
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
})

export const containerClient = hc<ContainerAPIType>(ENV.CONTAINER_API, {
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
})
