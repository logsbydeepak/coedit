import { createEnv } from '@t3-oss/env-nextjs'

import { z } from '@coedit/zschema'

const zRequired = z.string().min(1, { message: 'required' }).trim()

export const env = createEnv({
  client: {
    NEXT_PUBLIC_API_URL: zRequired.url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
})
