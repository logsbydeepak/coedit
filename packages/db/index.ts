import { drizzle } from 'drizzle-orm/postgres-js'

import * as schema from './schema'

export { eq, and, desc } from 'drizzle-orm'

export const db = ({ DB_URL }: { DB_URL: string }) => {
  return drizzle({ connection: DB_URL, casing: 'snake_case' })
}
export const dbSchema = schema
