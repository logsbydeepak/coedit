import { z, zReqString } from '@coedit/zschema'

const schema = z.object({
  WORKDIR: zReqString,
  DOCKER_SOCKET_PATH: zReqString,
  ROOT_DOMAIN: zReqString,
  USER_API: zReqString.url(),
  CORS_ORIGIN: zReqString.url(),

  UPSTASH_REDIS_REST_URL: zReqString.url(),
  UPSTASH_REDIS_REST_TOKEN: zReqString,

  MACHINE_IP: zReqString,
  MACHINE_SECRET: zReqString,
  MAX_CAPACITY: z.coerce.number().int().positive().default(1),

  S3_ACCESS_KEY_ID: zReqString,
  S3_SECRET_ACCESS_KEY: zReqString,
  S3_BUCKET: zReqString,
})

const parseEnv = schema.safeParse(process.env)

if (parseEnv.error) {
  const error = z.prettifyError(parseEnv.error)
  console.log(error)
  throw new Error('Invalid environment variables')
}

export const env = parseEnv.data

export type ENV = z.infer<typeof schema>
