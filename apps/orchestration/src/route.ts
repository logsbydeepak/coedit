import { secureHeaders } from 'hono/secure-headers'

import { h } from './utils/h'

export const app = h().use(secureHeaders())

export type AppType = typeof app
