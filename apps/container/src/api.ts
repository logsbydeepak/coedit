import { getCookie } from 'hono/cookie'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { secureHeaders } from 'hono/secure-headers'

import { env } from './env'
import { contentRoute } from './route/content'
import { explorerRoute } from './route/explorer'
import { apiClient } from './utils/api-client'
import { h } from './utils/h'
import { emitStop, setActive } from './utils/lifecycle'

const route = h()
  .route('/explorer', explorerRoute)
  .route('/content', contentRoute)

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
    const cookie = getCookie(c, 'x-auth')

    if (!cookie) {
      emitStop()
      throw new HTTPException(401, { res: errorResponse })
    }

    const res = await apiClient(cookie).user.isAuth.$get()
    const resData = await res.json()

    if (resData.code !== 'OK') {
      emitStop()
      throw new HTTPException(401, { res: errorResponse })
    }

    await next()
  })
  .route('/api', route)

export type AppType = typeof app
