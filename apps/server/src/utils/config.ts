import { S3Client } from '@aws-sdk/client-s3'
import { DOMParser } from '@xmldom/xmldom'
import { Files } from 'files-sdk'
import { s3 } from 'files-sdk/s3'
import { hc } from 'hono/client'

import { RedisCloudflare } from '@coedit/kv'
import { AppType } from '@coedit/orchestration'

import { ENV } from './env'

globalThis.DOMParser = DOMParser
globalThis.Node = {
  ELEMENT_NODE: 1,
  ATTRIBUTE_NODE: 2,
  TEXT_NODE: 3,
  CDATA_SECTION_NODE: 4,
  COMMENT_NODE: 8,
  DOCUMENT_NODE: 9,
} as any

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

export function files(
  env: Pick<
    ENV,
    'S3_BUCKET' | 'S3_ACCESS_KEY_ID' | 'S3_SECRET_ACCESS_KEY' | 'S3_REGION'
  >
) {
  return new Files({
    adapter: s3({
      bucket: env.S3_BUCKET,
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    }),
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
