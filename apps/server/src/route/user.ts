import { Hono } from 'hono'
import { zEmail } from '@coedit/package-zschema'
import { zValidator } from '@hono/zod-validator'

export const usersApp = new Hono()
  .get('/users', (c) => {
    return c.text('users')
  })
  .post(
    '/login',
    zValidator(
      'json',
      zEmail,

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
