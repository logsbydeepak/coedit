import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import ms from 'ms'
import { ulid } from 'ulidx'

import { zEmail, zObject, zReqString } from '@coedit/zschema'

import { db, dbSchema } from '#/db'
import { redis } from '#/lib/config'
import {
  codeGenerator,
  generateAuthToken,
  sendAuthEmail,
  setAuthCookie,
} from '#/utils/auth'
import { h, r } from '#/utils/h'

const zUserEmail = zObject({
  email: zEmail,
})

const zCode = zObject({
  email: zEmail,
  code: zReqString,
})

const login = h().post('/', zValidator('json', zUserEmail), async (c) => {
  const input = c.req.valid('json')
  const redisClient = redis(c.env)

  const isCodeSent = await redisClient.exists(`login:${input.email}`)
  if (isCodeSent) {
    return c.json(r('EMAIL_ALREADY_SENT'))
  }

  const dbClient = db(c.env)
  const [user] = await dbClient
    .select()
    .from(dbSchema.users)
    .where(eq(dbSchema.users.email, input.email))

  if (!user) {
    return c.json(r('USER_NOT_FOUND'))
  }

  const code = codeGenerator()
  const { error } = await sendAuthEmail(c.env, {
    code,
    email: input.email,
  })

  if (error) {
    throw new Error("can't send email")
  }

  const addToSendList = await redisClient.set(`login:${input.email}`, code, {
    px: ms('15 minutes'),
  })
  if (addToSendList !== 'OK') {
    throw new Error("can't set redis key")
  }

  return c.json(r('OK'))
})

const loginVerify = h().post('/', zValidator('json', zCode), async (c) => {
  const input = c.req.valid('json')

  const redisClient = redis(c.env)
  const code = await redisClient.get<number>(`login:${input.email}`)
  if (!code) {
    return c.json(r('CODE_EXPIRED'))
  }

  if (code.toString() !== input.code) {
    return c.json(r('CODE_NOT_MATCH'))
  }

  const deleteCode = await redisClient.del(`login:${input.email}`)
  if (!deleteCode) {
    throw new Error("can't delete redis key")
  }

  const userId = ulid()
  const [user] = await db(c.env)
    .select()
    .from(dbSchema.users)
    .where(eq(dbSchema.users.email, input.email))

  if (!user) {
    return c.json(r('USER_NOT_FOUND'))
  }

  const token = await generateAuthToken({ ...c.env, userId })
  setAuthCookie(c, token)

  return c.json(r('OK'))
})

const register = h().post('/', zValidator('json', zUserEmail), async (c) => {
  const input = c.req.valid('json')

  const redisClient = redis(c.env)

  const isCodeSent = await redisClient.exists(`register:${input.email}`)
  if (isCodeSent) {
    return c.json(r('EMAIL_ALREADY_SENT'))
  }

  const [user] = await db(c.env)
    .select()
    .from(dbSchema.users)
    .where(eq(dbSchema.users.email, input.email))

  if (user) {
    return c.json(r('USER_ALREADY_EXIST'))
  }

  const code = codeGenerator()
  const { error } = await sendAuthEmail(c.env, {
    code,
    email: input.email,
  })

  if (error) {
    throw new Error("can't send email")
  }

  const addToSendList = await redisClient.set(`register:${input.email}`, code, {
    px: ms('15 minutes'),
  })
  if (addToSendList !== 'OK') {
    throw new Error("can't set redis key")
  }

  return c.json(r('OK'))
})

const registerVerify = h().post('/', zValidator('json', zCode), async (c) => {
  const input = c.req.valid('json')

  const redisClient = redis(c.env)

  const code = await redisClient.get<number>(`register:${input.email}`)
  if (!code) {
    return c.json(r('CODE_EXPIRED'))
  }

  if (code.toString() !== input.code) {
    return c.json(r('CODE_NOT_MATCH'))
  }

  const deleteCode = await redisClient.del(`register:${input.email}`)
  if (!deleteCode) {
    throw new Error("can't delete redis key")
  }

  const userId = ulid()
  const name = input.email.split('@')[0]

  const user = await db(c.env).insert(dbSchema.users).values({
    id: userId,
    email: input.email,
    name,
  })
  if (!user) {
    throw new Error("can't create user")
  }

  const token = await generateAuthToken({ ...c.env, userId })
  setAuthCookie(c, token)

  return c.json(r('OK'))
})

export const authRoute = h()
  .route('/login', login)
  .route('/register', register)
  .route('/login/verify', loginVerify)
  .route('/register/verify', registerVerify)
