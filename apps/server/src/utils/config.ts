import { S3Client } from '@aws-sdk/client-s3'
import { hc } from 'hono/client'
import { Resend } from 'resend'

import { RedisCloudflare } from '@coedit/kv'
import { AppType } from '@coedit/orchestration'

import { ENV } from './env'

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

export const orchestration = (
  env: Pick<ENV, 'ORCHESTRATION_URL' | 'ORCHESTRATION_SECRET'>
) => {
  return hc<AppType>(env.ORCHESTRATION_URL, {
    fetch: async (input, requestInit, _Env, _executionCtx) => {
      const headers = new Headers(requestInit?.headers)
      headers.set(
        'cookie',
        `x-orchestration-secret=${env.ORCHESTRATION_SECRET}`
      )

      const newRequestInit: RequestInit = {
        ...requestInit,
        headers,
      }

      const res = await fetch(input, newRequestInit)

      if (!res.ok) {
        const body = await res.text()
        throw new ResponseError(res.status, res.statusText, body)
      }

      return res
    },
  })
}

export function s3Client(
  env: Pick<ENV, 'S3_ACCESS_KEY_ID' | 'S3_SECRET_ACCESS_KEY' | 'S3_REGION'>
) {
  return new S3Client({
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    region: env.S3_REGION,
  })
}

export class ResponseError extends Error {
  status: number
  body: string

  constructor(status: number, statusText: string, body: string) {
    super(`Orchestration request failed: ${status} ${statusText} — ${body}`)
    this.status = status
    this.body = body
  }
}
