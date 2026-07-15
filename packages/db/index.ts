import { drizzle } from 'drizzle-orm/postgres-js'

import * as authSchema from './auth-schema'
import * as schema from './schema'

export { eq, and, desc } from 'drizzle-orm'

export const db = ({ DB_URL }: { DB_URL: string }) => {
  return drizzle({
    connection: DB_URL,
    casing: 'snake_case',
    schema: { ...schema, ...authSchema },
  })
}
export const dbSchema = schema
export const dbAuthSchema = authSchema
