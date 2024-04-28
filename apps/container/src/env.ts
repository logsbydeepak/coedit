import { z } from 'zod'

import { zReqString } from '@coedit/zschema'

const schema = z.object({
  API_PORT: z.coerce.number().gte(1000).lte(9999),
  WS_PORT: z.coerce.number().gte(1000).lte(9999),
  CONTAINER_ID: zReqString,
  USER_API: zReqString.url(),
  USER_ID: zReqString,
  CONTAINER_API: zReqString.url(),
})

export const ENV = schema.parse(process.env)
