import { z } from 'zod'

import { zReqString } from '@coedit/zschema'

const schema = z.object({
  USER_API: zReqString.url(),
  CORS_ORIGIN: zReqString.url(),
  RUNTIME: z.enum(['production', 'development']),
})

export const env = schema.parse(process.env)
