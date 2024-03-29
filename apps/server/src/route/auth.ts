import { zEmail, zNumber, zObject } from '@coedit/package-zschema'
import { zValidator } from '@hono/zod-validator'
import { db, dbSchema } from '../db'
import { eq } from 'drizzle-orm'
import { resend, redis } from '../lib/config'
import ms from 'ms'
import * as jose from 'jose'
import { setCookie } from 'hono/cookie'
import { ulid } from 'ulidx'
import { h } from '../utils/h'

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

const sendAuthEmail = ({
  RESEND_API_KEY,
  RESEND_FROM,
  email,
  code,
}: {
  RESEND_API_KEY: string
  RESEND_FROM: string
  email: string
  code: number
}) => {
  return resend({
    RESEND_API_KEY: RESEND_API_KEY,
  }).emails.send({
    from: RESEND_FROM,
    to: email,
    subject: `coedit: code ${code}`,
    text: `coedit: code ${code}`,
  })
}

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

const login = h().get('/', zValidator('json', zUserEmail), async (c) => {
  const input = c.req.valid('json')
  const redisClient = redis(c.env)
  const redisRes = await redisClient.exists(`login:${input.email}`)
  if (redisRes) {
    return c.json({
      error: 'email already sent',
    })
  }

  const dbClient = db(c.env)
  const [user] = await dbClient
    .select()
    .from(dbSchema.users)
    .where(eq(dbSchema.users.email, input.email))

  if (!user) {
    return c.json({ error: 'user not found' })
  }

  const code = codeGenerator()

  const { error } = await sendAuthEmail({
    ...c.env,
    code,
    email: input.email,
  })

  if (error) {
    throw new Error("can't send email")
  }

  await redisClient.set(`login:${input.email}`, code, {
    px: ms('15 minutes'),
  })

  return c.json({ success: true })
})

const loginVerify = h().post('/', zValidator('form', zCode), async (c) => {
  const input = c.req.valid('form')

  const redisClient = redis(c.env)
  const code = await redisClient.get(`login:${input.email}`)

  if (code === null) {
    return c.json({ error: 'code expired' })
  }

  if (code !== input.code) {
    return c.json({ error: 'code not match' })
  }
  await redisClient.del(`login:${input.email}`)

  const userId = ulid()

  const user = await db(c.env)
    .select()
    .from(dbSchema.users)
    .where(eq(dbSchema.users.email, input.email))

  if (!user) {
    return c.json({ error: 'user not found' })
  }

  const token = await generateAuthToken({ ...c.env, userId })

  setCookie(c, 'x-auth', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'Strict',
    secure: true,
    maxAge,
  })

  return c.json({
    success: true,
  })
})

const register = h().post('/', zValidator('json', zUserEmail), async (c) => {
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
  const { error } = await sendAuthEmail({
    ...c.env,
    code,
    email: input.email,
  })

  if (error) {
    throw new Error("can't send email")
  }

  await redisClient.set(`register:${input.email}`, code, {
    px: ms('15 minutes'),
  })

  return c.json({ success: true })
})

const registerVerify = h().post('/', zValidator('form', zCode), async (c) => {
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
    name: 'test',
  })

  const token = await generateAuthToken({ ...c.env, userId })

  setCookie(c, 'x-auth', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'Strict',
    secure: true,
    maxAge,
  })

  return c.json({
    success: true,
  })
})

export const authRoute = h()
  .route('/login', login)
  .route('/register', register)
  .route('/login/verify', loginVerify)
  .route('/register/verify', registerVerify)
