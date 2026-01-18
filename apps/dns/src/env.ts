import { z, zReqString } from '@coedit/zschema'

const schema = z.object({
  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: zReqString,
  ROOT_DOMAIN: zReqString,
})

const parseEnv = schema.safeParse(process.env)

if (parseEnv.error) {
  const error = z.prettifyError(parseEnv.error)
  console.log(error)
  throw new Error('Invalid environment variables')
}

export type ENV = z.infer<typeof schema>
