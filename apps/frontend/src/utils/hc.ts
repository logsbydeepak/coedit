import { env } from '@/env'
import { type AppType } from '@coedit/app-server'
import { hc } from 'hono/client'

export const apiClient = hc<AppType>(env.NEXT_PUBLIC_API_URL)
