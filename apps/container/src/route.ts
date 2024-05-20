import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { secureHeaders } from 'hono/secure-headers'

import { env } from './env'
import { contentRoute } from './route/content'
import { explorerRoute } from './route/explorer'
import { terminalRoute } from './route/terminal'
import { apiClient } from './utils/api-client'
import { h } from './utils/h'
import { emitStop, setActive } from './utils/lifecycle'
import { logger } from './utils/logger'

const route = h()
  .route('/explorer', explorerRoute)
  .route('/content', contentRoute)
  .route('/terminal', terminalRoute)

const errorResponse = new Response('Unauthorized', {
  status: 401,
})

export const app = h()
  .use(
    cors({
      origin: () => env.CORS_ORIGIN,
      credentials: true,
    })
  )
  .use(secureHeaders())
  .use(async (c, next) => {
    setActive()
    const url = new URL(c.req.url)
    let token: string | undefined | null = ''
    if (url.pathname === '/terminal') {
      token = url.searchParams.get('x-auth')
    } else {
      token = c.req.header('x-auth')
    }

    if (!token) {
      emitStop()
      throw new HTTPException(401, { res: errorResponse })
    }

    const isAuth = await auth(token)
    if (!isAuth) {
      emitStop()
      throw new HTTPException(401, { res: errorResponse })
    }

    await next()
  })
  .route('/', route)

const auth = async (token: string) => {
  try {
    const res = await apiClient(token).user.isAuth.$get()
    const resData = await res.json()
    return resData.code === 'OK'
  } catch (error) {
    logger.error('error while checking auth')
    return false
  }
}

export type AppType = typeof app
