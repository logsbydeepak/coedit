import { z, zReqString } from '@coedit/zschema'

const schema = z.object({
  BETTER_AUTH_URL: zReqString,
  BETTER_AUTH_SECRET: zReqString,
  GOOGLE_CLIENT_ID: zReqString,
  GOOGLE_CLIENT_SECRET: zReqString,

  DB_URL: zReqString.url(),
  RUNTIME: z.enum(['development', 'production']),
  CORS_ORIGIN: zReqString.url(),
  COOKIE_DOMAIN: zReqString,

  UPSTASH_REDIS_REST_URL: zReqString.url(),
  UPSTASH_REDIS_REST_TOKEN: zReqString,

  ORCHESTRATION_URL: zReqString.url(),
  ORCHESTRATION_MODE: z.enum(['mock', 'caddy']),
  MACHINE_SECRET: zReqString,

  S3_BUCKET: zReqString,
  S3_SECRET_ACCESS_KEY: zReqString,
  S3_ACCESS_KEY_ID: zReqString,
  S3_REGION: zReqString,
})

export type ENV = z.infer<typeof schema>

export const ENV_KEYS = Object.keys(schema.shape) as (keyof ENV)[]
