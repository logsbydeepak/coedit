import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'

import { checkIsAuth } from './auth'

export type ENV = {
  RESEND_API_KEY: string
  RESEND_FROM: string
  DB_URL: string
  UPSTASH_REDIS_REST_URL: string
  UPSTASH_REDIS_REST_TOKEN: string
  JWT_SECRET: string
  RUNTIME: 'deployment' | 'production'
  CORS_ORIGIN: string

  AWS_REGION: string
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  AWS_SECURITY_GROUP_ID: string
  AWS_SUBNET_ID: string
  AWS_ECS_INFRASTRUCTURE_ROLE_ARN: string

  CONTAINER_MODE: 'mock' | 'aws'
}

type Variables = {
  'x-userId': string
  'x-auth': string
}

export const hono = <T extends Variables>() =>
  new Hono<{
    Bindings: ENV
    Variables: T
  }>()

export const h = () => hono()

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
