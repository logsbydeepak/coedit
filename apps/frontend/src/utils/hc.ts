import { hc } from 'hono/client'

import type { AppType } from '@coedit/server'

import { env } from '#/env'

export const apiClient = hc<AppType>(env.NEXT_PUBLIC_API_URL)
