import { z, zReqString } from '@coedit/zschema'

const schema = z.object({
  WORKDIR: zReqString,
  DOCKER_SOCKET_PATH: zReqString,
})

export const env = schema.parse(process.env)
