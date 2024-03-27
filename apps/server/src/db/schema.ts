import { pgTable, serial, varchar } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey().notNull(),
  name: varchar('phone', { length: 256 }).notNull(),
  email: varchar('phone', { length: 256 }).unique().notNull(),
})
