import { Hono } from 'hono'
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

import { r } from '@coedit/r'

import { authClient } from './auth'
import { ENV } from './env'

type auth = ReturnType<typeof authClient>

type Variables = {
  'x-userId': string
  user: auth['$Infer']['Session']['user']
  session: auth['$Infer']['Session']['session']
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
    console.log(c.env.CORS_ORIGIN)
    const client = authClient(c.env)
    const session = await client.api.getSession({ headers: c.req.raw.headers })

    if (!session) {
      const errorResponse = new Response('Unauthorized', {
        status: 401,
      })
      throw new HTTPException(401, { res: errorResponse })
    }

    c.set('user', session.user)
    c.set('session', session.session)
    c.set('x-userId', session.user.id)

    await next()
  })

export const validationHook = (result: { success: boolean }, c: Context) => {
  if (!result.success) return c.json(r('VALIDATION_ERROR'), 400)
}
