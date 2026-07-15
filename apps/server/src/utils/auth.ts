import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

import { db, dbAuthSchema } from '@coedit/db'

import { ENV } from './env'

export const authClient = (
  env: Pick<
    ENV,
    | 'DB_URL'
    | 'BETTER_AUTH_URL'
    | 'BETTER_AUTH_SECRET'
    | 'GOOGLE_CLIENT_ID'
    | 'GOOGLE_CLIENT_SECRET'
    | 'CORS_ORIGIN'
  >
) => {
  return betterAuth({
    basePath: '/auth',
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.CORS_ORIGIN],
    database: drizzleAdapter(db({ DB_URL: env.DB_URL }), {
      provider: 'pg',
      schema: dbAuthSchema,
    }),
    secret: env.BETTER_AUTH_SECRET,
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        // Don't auto-create an account on sign in. New users are only
        // created when `requestSignUp: true` is passed (the sign up button).
        disableImplicitSignUp: true,
      },
    },
    advanced: {
      cookies: {
        session_token: {
          name: 'x-auth',
        },
      },
    },
  })
}
