import { z, zReqString } from '@coedit/zschema'

const schema = z.object({
  USER_API: zReqString.url(),
  CORS_ORIGIN: zReqString.url(),
  ROOT_DOMAIN: zReqString,
})

export const env = schema.parse(process.env)
