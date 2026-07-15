import { Env } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'

import { projectRoute } from './route/project'
import { templateRoute } from './route/template'
import { userRoute } from './route/user'
import { authClient } from './utils/auth'
import { h } from './utils/h'

const app = h()
  .use(secureHeaders())
  .use(
    cors({
      origin: (_, c) => c.env.CORS_ORIGIN,
      credentials: true,
    })
  )
  .on(['POST', 'GET'], '/auth/*', (c) => authClient(c.env).handler(c.req.raw))
  .route('/user', userRoute)
  .route('/project', projectRoute)
  .route('/template', templateRoute)

export type AppType = typeof app

export default {
  fetch: async (request: Request, env: Env) => await app.fetch(request, env),
}
