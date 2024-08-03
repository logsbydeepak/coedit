import { z, zReqString } from '@coedit/zschema'

const schema = z.object({})

export const env = schema.parse(process.env)
