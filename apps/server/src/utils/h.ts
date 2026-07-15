import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { HTTPException } from 'hono/http-exception'

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
    const authToken = getCookie(c, 'x-auth')

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
