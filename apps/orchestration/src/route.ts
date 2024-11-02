import { HTTPException } from 'hono/http-exception'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'

import { env } from './env'
import { projectRoute } from './route/project'
import { h } from './utils/h'

export const app = h()
  .use(logger())
  .use(secureHeaders())
  .use(async (c, next) => {
    const clientOrchestrationSecret = c.req.header('x-orchestration-secret')

    if (clientOrchestrationSecret !== env.ORCHESTRATION_SECRET) {
      throw new HTTPException(401)
    }

    return await next()
  })
  .route('project', projectRoute)

export type AppType = typeof app
