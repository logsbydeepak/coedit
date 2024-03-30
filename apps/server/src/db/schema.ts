import { pgTable, varchar, index } from 'drizzle-orm/pg-core'

const id = (name = 'id') => varchar(name, { length: 26 }).notNull()

export const users = pgTable(
  'users',
  {
    id: id(),
    name: varchar('name', { length: 256 }).notNull(),
    email: varchar('email', { length: 256 }).unique().notNull(),
  },
  (table) => {
    return {
      emailIdx: index('email_idx').on(table.email),
    }
  }
)
