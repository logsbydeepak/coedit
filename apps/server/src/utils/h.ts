import { Hono } from 'hono'

type ENV = {
  RESEND_API_KEY: string
  RESEND_FROM: string
  DB_URL: string
  UPSTASH_REDIS_REST_URL: string
  UPSTASH_REDIS_REST_TOKEN: string
  JWT_SECRET: string
}

export const h = () => {
  return new Hono<{
    Bindings: ENV
  }>()
}
