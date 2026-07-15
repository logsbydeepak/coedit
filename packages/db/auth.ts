import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import * as t from 'drizzle-orm/pg-core'

export const auth = betterAuth({
  database: drizzleAdapter(t, {
    provider: 'pg',
  }),
})
