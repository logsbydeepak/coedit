import { env as _env } from 'cloudflare:workers'

import { z, zReqString } from '@coedit/zschema'

const schema = z.object({
  RESEND_API_KEY: zReqString,
  RESEND_FROM: zReqString,

  DB_URL: zReqString.url(),
  JWT_SECRET: zReqString,
  RUNTIME: z.enum(['development', 'production']),
  CORS_ORIGIN: zReqString.url(),
  COOKIE_DOMAIN: zReqString,

  UPSTASH_REDIS_REST_URL: zReqString.url(),
  UPSTASH_REDIS_REST_TOKEN: zReqString,

  ORCHESTRATION_URL: zReqString.url(),
  ORCHESTRATION_MODE: z.enum(['mock', 'caddy']),
  ORCHESTRATION_SECRET: zReqString,
})

const parseEnv = schema.safeParse(_env)

if (parseEnv.error) {
  const error = z.flattenError(parseEnv.error)
  console.log(error)
  throw new Error('Invalid environment variables')
}

export const env = parseEnv.data

export type ENV = z.infer<typeof schema>
