import { z, zReqString } from '@coedit/zschema'

const schema = z.object({
  UPSTASH_REDIS_REST_URL: zReqString.url(),
  UPSTASH_REDIS_REST_TOKEN: zReqString,
  ROOT_DOMAIN: zReqString,
})

export const env = schema.parse(process.env)
