import Docker from 'dockerode'
import { Files } from 'files-sdk'
import { bunS3 } from 'files-sdk/bun-s3'

import { Redis } from '@coedit/kv/redis'

import { env } from '#/env'

export function redis() {
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
    enableAutoPipelining: true,
  })
}

export function files() {
  return new Files({
    adapter: bunS3({
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      bucket: env.S3_BUCKET,
    }),
  })
}

export const docker = new Docker({
  socketPath: env.DOCKER_SOCKET_PATH,
})
