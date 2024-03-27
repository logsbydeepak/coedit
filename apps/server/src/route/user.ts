import { Hono } from 'hono'
import { zEmail, zObject } from '@coedit/package-zschema'
import { zValidator } from '@hono/zod-validator'
import { env } from 'hono/adapter'

export const usersApp = new Hono()
  .get('/', (c) => {
    console.log(c.env)
    const { DB_URL } = env<{ DB_URL: string }>(c)
    console.log(DB_URL)
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
