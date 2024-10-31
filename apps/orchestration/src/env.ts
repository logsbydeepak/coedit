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
})

export const env = schema.parse(process.env)
