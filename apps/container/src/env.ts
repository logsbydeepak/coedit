import { z, zURL } from '@coedit/zschema'

const schema = z.object({
  USER_API: zURL,
  CORS_ORIGIN: zURL,
})

const parseEnv = schema.safeParse(process.env)

if (parseEnv.error) {
  const error = z.prettifyError(parseEnv.error)
  console.log(error)
  throw new Error('Invalid environment variables')
}

export const env = parseEnv.data

export type ENV = z.infer<typeof schema>
