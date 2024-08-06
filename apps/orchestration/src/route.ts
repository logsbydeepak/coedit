import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'

import { projectRoute } from './route/project'
import { h } from './utils/h'

export const app = h()
  .use(logger())
  .use(secureHeaders())
  .route('project', projectRoute)

export type AppType = typeof app
