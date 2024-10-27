import { hc } from 'hono/client'
import { Resend } from 'resend'

import { RedisCloudflare } from '@coedit/kv'
import { AppType } from '@coedit/orchestration'

import { ENV } from './h'

export const resend = (env: Pick<ENV, 'RESEND_API_KEY'>) => {
  return new Resend(env.RESEND_API_KEY)
}

export const redis = (
  env: Pick<ENV, 'UPSTASH_REDIS_REST_URL' | 'UPSTASH_REDIS_REST_TOKEN'>
) => {
  return new RedisCloudflare({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  })
}

export const orchestration = (env: Pick<ENV, 'ORCHESTRATION_URL'>) => {
  return hc<AppType>(env.ORCHESTRATION_URL, {
    fetch: (input, requestInit, Env, executionCtx) =>
      fetch(input, {
        ...requestInit,
      }).then((res) => {
        if (!res.ok) {
          throw new ResponseError(res.statusText, res)
        }

        return res
      }),
  })
}

export class ResponseError extends Error {
  response: Response
  constructor(message: string, res: Response) {
    super()
    this.message = message
    this.response = res
  }
}
