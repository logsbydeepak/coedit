import { z } from 'zod'

import { zReqString } from '@coedit/zschema'

const schema = z.object({
  USER_API: zReqString.url(),
  CORS_ORIGIN: zReqString.url(),
  ROOT_DOMAIN: zReqString.url(),
})

export const env = schema.parse(process.env)
