import * as t from 'drizzle-orm/pg-core'

const id = () => t.varchar({ length: 26 }).notNull()

export const templates = t.pgTable('templates', {
  id: id(),
  name: t.varchar({ length: 256 }).notNull(),
})

export const statusEnum = t.pgEnum('status', ['RUNNING', 'IDLE', 'PROCESSING'])

export const projects = t.pgTable(
  'projects',
  {
    id: id(),
    userId: t.text().notNull(),
    name: t.varchar({ length: 256 }).notNull(),
    createdAt: t.timestamp().defaultNow().notNull(),
    status: statusEnum().notNull(),
  },
  (table) => [t.index('userIdx').on(table.userId)]
)
