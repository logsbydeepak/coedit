import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'

import { checkIsAuth } from './auth'

export type ENV = {
  RESEND_API_KEY: string
  RESEND_FROM: string
  DB_URL: string
  JWT_SECRET: string
  RUNTIME: 'deployment' | 'production'
  CORS_ORIGIN: string
  COOKIE_DOMAIN: string

  UPSTASH_REDIS_REST_URL: string
  UPSTASH_REDIS_REST_TOKEN: string

  ORCHESTRATION_URL: string
  ORCHESTRATION_MODE: 'mock' | 'caddy'
  ORCHESTRATION_SECRET: string
}

type Variables = {
  'x-userId': string
  'x-auth': string
}

const hono = <T extends Variables>() =>
  new Hono<{
    Bindings: ENV
    Variables: T
  }>()

export const h = () => hono()

/** @alias */
export const hAuth = () =>
  hono<Variables>().use(async (c, next) => {
    const authToken = getCookie(c, 'x-auth')
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
