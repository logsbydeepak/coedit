import { Hono } from 'hono'

export const usersApp = new Hono()
  .get('/users', (c) => {
    return c.text('users')
  })
  .post('/login', (c) => {
    return c.text('login')
  })
  .post('/register', (c) => {
    return c.text('register')
  })
