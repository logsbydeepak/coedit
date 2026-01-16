import { Env } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'

import { authRoute } from './route/auth'
import { projectRoute } from './route/project'
import { templateRoute } from './route/template'
import { userRoute } from './route/user'
import { env } from './utils/env'
import { h } from './utils/h'

const app = h()
  .use(secureHeaders())
  .use(
    cors({
      origin: (_, c) => c.env.CORS_ORIGIN,
      credentials: true,
    })
  )
  .route('/user', userRoute)
  .route('/auth', authRoute)
  .route('/project', projectRoute)
  .route('/template', templateRoute)

export type AppType = typeof app

export default {
  fetch: async (request: Request, _env: Env) => await app.fetch(request, env),
}
