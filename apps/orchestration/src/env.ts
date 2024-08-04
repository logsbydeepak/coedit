import { z, zReqString } from '@coedit/zschema'

const schema = z.object({
  WORKDIR: zReqString,
})

export const env = schema.parse(process.env)
