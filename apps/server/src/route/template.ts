import { db, dbSchema } from '#/db'
import { h, hAuth, r } from '#/utils/h'

const get = hAuth().get('/', async (c) => {
  const projects = await db(c.env).select().from(dbSchema.templates)
  return c.json(
    r('OK', {
      projects,
    })
  )
})

export const templateRoute = h().route('/', get)
