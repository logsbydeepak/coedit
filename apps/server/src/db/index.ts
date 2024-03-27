import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

export const db = (url: string) => {
  const client = postgres(url)
  return drizzle(client)
}
export const dbSchema = schema
