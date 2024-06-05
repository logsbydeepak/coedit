import { Redis } from '@coedit/kv/redis'

import { env } from '#/env'

export function redis() {
  return new Redis({
    url: env.DNS_UPSTASH_REDIS_REST_URL,
    token: env.DNS_UPSTASH_REDIS_REST_TOKEN,
    enableAutoPipelining: true,
  })
}
