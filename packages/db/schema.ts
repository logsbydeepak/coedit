import * as t from 'drizzle-orm/pg-core'

const id = () => t.varchar({ length: 26 }).notNull()

export const users = t.pgTable(
  'users',
  {
    id: id(),
    name: t.varchar({ length: 256 }).notNull(),
    email: t.varchar({ length: 256 }).unique().notNull(),
  },
  (table) => {
    return {
      emailIdx: t.index().on(table.email),
    }
  }
)

export const templates = t.pgTable('templates', {
  id: id(),
  name: t.varchar({ length: 256 }).notNull(),
})

export const projects = t.pgTable(
  'projects',
  {
    id: id(),
    userId: t.varchar({ length: 26 }).notNull(),
    name: t.varchar({ length: 256 }).notNull(),
    createdAt: t.timestamp().defaultNow().notNull(),
  },
  (table) => {
    return {
      userIdx: t.index().on(table.userId),
    }
  }
)
