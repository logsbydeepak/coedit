import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { secureHeaders } from 'hono/secure-headers'

import { checkIsAuth } from './auth'

export type ENV = {
  RESEND_API_KEY: string
  RESEND_FROM: string
  DB_URL: string
  UPSTASH_REDIS_REST_URL: string
  UPSTASH_REDIS_REST_TOKEN: string
  JWT_SECRET: string
  RUNTIME: 'deployment' | 'production'

  AWS_REGION: string
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  AWS_BUCKET: string
}

type Variables = {
  'x-userId': string
  'x-auth': string
}

const _h = <T extends Variables>() =>
  new Hono<{
    Bindings: ENV
    Variables: T
  }>()
    .use(
      cors({
        origin: ['http://localhost:3000'],
        credentials: true,
      })
    )
    .use(secureHeaders())

export const h = () => _h()

export const hAuth = () =>
  _h<Variables>().use(async (c, next) => {
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
