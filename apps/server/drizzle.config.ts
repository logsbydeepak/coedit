import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  driver: 'pg',
  out: './drizzle',
  dbCredentials: {
    connectionString: process.env.DB_URL!!,
  },
} satisfies Config
