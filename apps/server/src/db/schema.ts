import { pgTable, serial, varchar } from 'drizzle-orm/pg-core'

const id = (name = 'id') => varchar(name, { length: 26 })

export const users = pgTable('users', {
  id: id(),
  name: varchar('phone', { length: 256 }).notNull(),
  email: varchar('phone', { length: 256 }).unique().notNull(),
})
