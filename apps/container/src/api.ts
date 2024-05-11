import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'

import { env } from './env'
import { fileExplorerRoute } from './route/fileExplorer'
import { h } from './utils/h'

const route = h.route('/fileExplorer', fileExplorerRoute)

export const app = h
  .use(
    cors({
      origin: () => env.CORS_ORIGIN,
      credentials: true,
    })
  )
  .use(secureHeaders())
  .route('/api', route)

export type AppType = typeof app
