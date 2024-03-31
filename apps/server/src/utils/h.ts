import { Hono } from 'hono'
import { checkIsAuth } from './auth'
import { HTTPException } from 'hono/http-exception'
import { secureHeaders } from 'hono/secure-headers'

export type ENV = {
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
  }>().use(secureHeaders())
}

export const hAuth = () => {
  return new Hono<{
    Bindings: ENV
    Variables: {
      'x-userId': string
      'x-auth': string
    }
  }>()
    .use(secureHeaders())
    .use(async (c, next) => {
      const authToken = c.req.header('x-auth')
      const isAuth = await checkIsAuth(c.env, authToken)

      if (isAuth.code !== 'OK') {
        const errorResponse = new Response('Unauthorized', {
          status: 401,
        })
        throw new HTTPException(401, { res: errorResponse })
      }

      c.set('x-userId', isAuth.userId)
      c.set('x-auth', isAuth.token)
      await next()
    })
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
