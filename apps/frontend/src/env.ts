import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

const zRequired = z.string().min(1, { message: 'required' }).trim()

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production']),
    DATABASE_URL: zRequired.url(),
    JWT_SECRET: zRequired,
    RESEND_API_KEY: zRequired,
    RESEND_FROM_EMAIL: zRequired,
    REDIS_URL: zRequired.url(),
    REDIS_TOKEN: zRequired,
    BASE_URL: zRequired.url(),
  },
  client: {},
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    REDIS_URL: process.env.REDIS_URL,
    REDIS_TOKEN: process.env.REDIS_TOKEN,
    BASE_URL: process.env.BASE_URL,
  },
})
