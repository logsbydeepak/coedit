import { Redis } from '@upstash/redis'

import { env } from '#/env'

export const redis = () => {
  return new Redis({
    url: env.DNS_UPSTASH_REDIS_REST_URL,
    token: env.DNS_UPSTASH_REDIS_REST_TOKEN,
  })
}
