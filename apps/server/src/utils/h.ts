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

type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export function r<CODE extends Uppercase<string>>(c: CODE): { code: CODE }
export function r<CODE extends Uppercase<string>, RES extends object>(
  c: CODE,
  res: RES
): Prettify<{ code: CODE } & RES>
export function r(code: string, res?: object) {
  if (res) {
    return { code: code, ...res }
  }

  if (code) {
    return { code: code }
  }

  throw new Error('Something went wrong!')
}
