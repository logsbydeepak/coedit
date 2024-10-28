import { Redis } from '@coedit/kv/redis'

import { env } from '#/env'

export function redis() {
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
    enableAutoPipelining: true,
  })
}
