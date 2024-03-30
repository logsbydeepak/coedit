import { zEmail, zNumber, zObject } from '@coedit/package-zschema'
import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { redis } from '@/lib/config'
import ms from 'ms'
import { ulid } from 'ulidx'
import { db, dbSchema } from '@/db'
import {
  codeGenerator,
  generateAuthToken,
  sendAuthEmail,
  setAuthCookie,
} from '@/utils/auth'
import { h } from '@/utils/h'

const zUserEmail = zObject({
  email: zEmail,
})

const zCode = zObject({
  email: zEmail,
  code: zNumber,
})

const login = h().post('/', zValidator('json', zUserEmail), async (c) => {
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

  const { error } = await sendAuthEmail(c.env, {
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
  setAuthCookie(c, token)

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
  const { error } = await sendAuthEmail(c.env, {
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
  setAuthCookie(c, token)

  return c.json({
    success: true,
  })
})

export const authRoute = h()
  .route('/login', login)
  .route('/register', register)
  .route('/login/verify', loginVerify)
  .route('/register/verify', registerVerify)
