import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'

import { authRoute } from './route/auth'
import { projectRoute } from './route/project'
import { templateRoute } from './route/template'
import { userRoute } from './route/user'
import { h } from './utils/h'

const route = h
  .route('/user', userRoute)
  .route('/auth', authRoute)
  .route('/project', projectRoute)
  .route('/template', templateRoute)

const app = h
  .use(
    cors({
      origin: (_, c) => c.env.CORS_ORIGIN,
      credentials: true,
    })
  )
  .use(secureHeaders())
  .route('/', route)

export type AppType = typeof app
export default app
