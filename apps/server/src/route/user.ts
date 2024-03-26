import { Hono } from 'hono'

export const usersApp = new Hono()
  .post('/login', (c) => {
    return c.text('login')
  })
  .post('/register', (c) => {
    return c.text('register')
  })
