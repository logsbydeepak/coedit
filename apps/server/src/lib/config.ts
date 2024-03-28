import { Resend } from 'resend'
import { Redis } from '@upstash/redis/cloudflare'

export const resend = ({ RESEND_API_KEY }: { RESEND_API_KEY: string }) => {
  return new Resend(RESEND_API_KEY)
}

export const redis = (env: {
  UPSTASH_REDIS_REST_URL: string
  UPSTASH_REDIS_REST_TOKEN: string
}) => {
  return Redis.fromEnv(env)
}
