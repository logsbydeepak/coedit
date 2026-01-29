import { S3Client } from 'bun'
import Docker from 'dockerode'

import { Redis } from '@coedit/kv/redis'

import { env } from '#/env'

export function redis() {
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
    enableAutoPipelining: true,
  })
}

export function s3Client() {
  return new S3Client({
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    bucket: env.S3_BUCKET,
  })
}

export const docker = new Docker({
  socketPath: env.DOCKER_SOCKET_PATH,
})
