import { AppType } from '@coedit/app-server'
import { hc } from 'hono/client'

const apiClient = hc<AppType>('')
