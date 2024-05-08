import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'

export const h = new Hono()
  .use(
    cors({
      origin: ['http://localhost:3000'],
      credentials: true,
    })
  )
  .use(secureHeaders())
