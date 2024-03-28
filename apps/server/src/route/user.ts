import { Hono } from 'hono'
import { zEmail, zObject } from '@coedit/package-zschema'
import { zValidator } from '@hono/zod-validator'
import { db, dbSchema } from '../db'
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

export const usersApp = new Hono<{
  Bindings: ENV
}>()
  .get('/', (c) => {
    return c.text('ok')
  })
  .post('/login', zValidator('json', zUserEmail), (c) => {
    return c.text('login')
  })
  .post('/register', zValidator('json', zUserEmail), async (c) => {
    const input = c.req.valid('json')

    const redisClient = redis(c.env)
    const redisRes = await redisClient.exists(`register${input.email}`)
    if (redisRes) {
      return c.json({
        error: 'email already sent',
      })
    }

    const dbClient = db(c.env)
    const isUserExist = await dbClient
      .select()
      .from(dbSchema.users)
      .where(eq(dbSchema.users.email, input.email))

    if (isUserExist.length !== 0) {
      return c.json({ error: 'user already exist' })
    }

    const code = codeGenerator()

    const { error } = await resend({
      RESEND_API_KEY: c.env.RESEND_API_KEY,
    }).emails.send({
      from: c.env.RESEND_FROM,
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

    return c.json({ success: true })
  })
