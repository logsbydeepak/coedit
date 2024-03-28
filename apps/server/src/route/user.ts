import { Hono } from 'hono'
import { zEmail, zObject } from '@coedit/package-zschema'
import { zValidator } from '@hono/zod-validator'
import { db, dbSchema } from '../db'
import { env } from 'hono/adapter'
import { eq } from 'drizzle-orm'
import { resend, redis } from '../lib/config'
import ms from 'ms'

type ENV = {
  RESEND_API_KEY: string
  RESEND_FROM: string
  DB_URL: string
  UPSTASH_REDIS_REST_URL: string
  UPSTASH_REDIS_REST_TOKEN: string
}

const zUserEmail = zObject({
  email: zEmail,
})

const codeGenerator = () => Math.floor(100000 + Math.random() * 900000)

export const usersApp = new Hono()
  .get('/', async (c) => {
    return c.text('HI')
  })
  .post(
    '/login',
    zValidator('json', zUserEmail, (data, c) => {
      if (!data.success) {
        return c.json({ error: 'invalid email' })
      }

      return c.text('login')
    })
  )
  .post(
    '/register',
    zValidator('json', zUserEmail, async (data, c) => {
      if (!data.success) {
        return c.json({ error: 'invalid email' })
      }
      const input = data.data

      const ENV = env<ENV>(c)

      const redisClient = redis(ENV)

      const redisRes = await redisClient.exists(`register${input.email}`)
      if (redisRes) {
        return c.json({
          error: 'email already sent',
        })
      }

      const isUserExist = await db(ENV)
        .select()
        .from(dbSchema.users)
        .where(eq(dbSchema.users.email, input.email))

      if (isUserExist.length !== 0) {
        return c.json({ error: 'user already exist' })
      }

      const code = codeGenerator()

      const { error } = await resend({
        RESEND_API_KEY: ENV.RESEND_API_KEY,
      }).emails.send({
        from: ENV.RESEND_FROM,
        to: input.email,
        subject: `coedit: code ${code}`,
        text: `coedit: code ${code}`,
      })

      if (error) {
        throw new Error("can't send email")
      }

      await redisClient.set(`register:${input.email}`, code, {
        px: ms('15 minutes'),
      })

      return c.text('register')
    })
  )
