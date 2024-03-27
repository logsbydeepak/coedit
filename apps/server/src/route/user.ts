import { Hono } from 'hono'
import { zEmail, zObject } from '@coedit/package-zschema'
import { zValidator } from '@hono/zod-validator'
import { db, dbSchema } from '../db'
import { env } from 'hono/adapter'

export const usersApp = new Hono()
  .get('/', async (c) => {
    const { DB_URL } = env<{ DB_URL: string }>(c)
    try {
      const res = await db(DB_URL).select().from(dbSchema.users)
      console.log(res)
    } catch (error) {
      console.error(error)
    }

    return c.text('users')
  })
  .post(
    '/login',
    zValidator(
      'json',
      zObject({
        email: zEmail,
      }),
      (data, c) => {
        if (!data.success) {
          return c.json({ error: 'invalid email' })
        }

        return c.text('login')
      }
    )
  )
  .post('/register', (c) => {
    return c.text('register')
  })
