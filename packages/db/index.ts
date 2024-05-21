import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import * as schema from './schema'

export const db = ({ DB_URL }: { DB_URL: string }) => {
  const sql = neon(DB_URL)
  return drizzle(sql)
}
export const dbSchema = schema
