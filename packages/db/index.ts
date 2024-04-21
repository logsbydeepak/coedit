import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

export const db = ({ DB_URL }: { DB_URL: string }) => {
  const client = postgres(DB_URL)
  return drizzle(client)
}
export const dbSchema = schema
