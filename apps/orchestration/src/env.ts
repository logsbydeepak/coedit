import { z, zReqString } from '@coedit/zschema'

const schema = z.object({
  WORKDIR: zReqString,
  DOCKER_SOCKET_PATH: zReqString,
  ROOT_DOMAIN: zReqString,
  UPSTASH_REDIS_REST_URL: zReqString.url(),
  UPSTASH_REDIS_REST_TOKEN: zReqString,
  PROXY_CONTAINER_ID: zReqString,
  PUBLIC_IP: zReqString,
  USER_API: zReqString.url(),
  CORS_ORIGIN: zReqString.url(),
  ORCHESTRATION_SECRET: zReqString,

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
