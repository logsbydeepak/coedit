import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'

import { authRoute } from './route/auth'
import { projectRoute } from './route/project'
import { templateRoute } from './route/template'
import { userRoute } from './route/user'
import { ENV, h } from './utils/h'
import { scheduled } from './utils/scheduled'

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
  fetch: async (request: Request, env: ENV) => await app.fetch(request, env),

  scheduled: async (
    _event: ScheduledEvent,
    env: ENV,
    ctx: ExecutionContext
  ) => {
    ctx.waitUntil(scheduled(env))
  },
}
