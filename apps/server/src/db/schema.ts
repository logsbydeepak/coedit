import { index, pgTable, varchar } from 'drizzle-orm/pg-core'

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

export const projects = pgTable(
  'projects',
  {
    id: id(),
    name: varchar('name', { length: 256 }).notNull(),
    userId: varchar('user_id', { length: 26 }).notNull(),
  },
  (table) => {
    return {
      userIdx: index('user_idx').on(table.userId),
    }
  }
)

export const baseProjects = pgTable('base_projects', {
  id: id(),
  name: varchar('name', { length: 256 }).notNull(),
})
