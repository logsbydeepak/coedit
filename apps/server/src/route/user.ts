import { Hono } from 'hono'
import { zEmail, zNumber, zObject } from '@coedit/package-zschema'
import { zValidator } from '@hono/zod-validator'
import { db, dbSchema } from '../db'
import { eq } from 'drizzle-orm'
import { resend, redis } from '../lib/config'
import ms from 'ms'
import * as jose from 'jose'
import { setCookie } from 'hono/cookie'
import { ulid } from 'ulidx'

type ENV = {
  RESEND_API_KEY: string
  RESEND_FROM: string
  DB_URL: string
  UPSTASH_REDIS_REST_URL: string
  UPSTASH_REDIS_REST_TOKEN: string
  JWT_SECRET: string
}

const zUserEmail = zObject({
  email: zEmail,
})

const zCode = zObject({
  email: zEmail,
  code: zNumber,
})

const codeGenerator = () => Math.floor(100000 + Math.random() * 900000)

function genExpTime(ExpMs: number) {
  return Date.now() + ExpMs
}
const maxAge = ms('30 days')

const generateAuthToken = async ({
  JWT_SECRET,
  userId,
}: {
  JWT_SECRET: string
  userId: string
}) => {
  const secret = jose.base64url.decode(JWT_SECRET)
  return await new jose.EncryptJWT({ userId })
    .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
    .setAudience('auth')
    .setExpirationTime(genExpTime(maxAge))
    .encrypt(secret)
}

export const usersApp = new Hono<{
  Bindings: ENV
}>()
  .get('/', (c) => {
    return c.text('ok')
  })
  .post('/login', zValidator('json', zUserEmail), (c) => {
    return c.text('login')
  })
  .post('/login/validate', zValidator('form', zCode), (c) => {
    return c.text('validate')
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
  .post('/register/validate', zValidator('form', zCode), async (c) => {
    const input = c.req.valid('form')

    const redisClient = redis(c.env)
    const code = await redisClient.get(`register:${input.email}`)

    if (code === null) {
      return c.json({ error: 'code expired' })
    }

    if (code !== input.code) {
      return c.json({ error: 'code not match' })
    }
    await redisClient.del(`register:${input.email}`)

    const userId = ulid()
    await db(c.env).insert(dbSchema.users).values({
      id: userId,
      email: input.email,
      name: 'Hi',
    })

    const token = await generateAuthToken({ ...c.env, userId })
    setCookie(c, 'x-auth', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'Strict',
      secure: true,
      maxAge,
    })

    return c.text('validate')
  })
