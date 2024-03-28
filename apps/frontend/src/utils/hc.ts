import { AppType } from '@coedit/app-server'
import { hc } from 'hono/client'

export const apiClient = hc<AppType>('')
