import { z } from 'zod'

import { zReqString } from '@coedit/zschema'

const schema = z.object({
  PORT: z.coerce.number().gte(1000).lte(9999),
  USER_API: zReqString.url(),
})

export const env = schema.parse(process.env)
