import { index, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'

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
      emailIdx: index('users_email_idx').on(table.email),
    }
  }
)

export const templates = pgTable('templates', {
  id: id(),
  name: varchar('name', { length: 256 }).notNull(),
})

export const projects = pgTable(
  'projects',
  {
    id: id(),
    userId: varchar('user_id', { length: 26 }).notNull(),
    name: varchar('name', { length: 256 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdx: index('projects_user_id_idx').on(table.userId),
    }
  }
)
