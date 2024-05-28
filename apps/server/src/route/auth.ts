import { zValidator } from '@hono/zod-validator'
import { Redis } from '@upstash/redis'
import { eq } from 'drizzle-orm'
import ms from 'ms'
import { z } from 'zod'

import { db, dbSchema } from '@coedit/db'
import { genID } from '@coedit/id'
import { r } from '@coedit/r'
import { zEmail, zReqString } from '@coedit/zschema'

import { redis } from '#/lib/config'
import {
  codeGenerator,
  generateAuthToken,
  sendAuthEmail,
  setAuthCookie,
} from '#/utils/auth'
import { h } from '#/utils/h'

function KVAuth(redis: Redis, type: 'login' | 'register', email: string) {
  const key = `${type}:$${email}`

  async function exists() {
    const res = await redis.exists(key)
    return !!res
  }

  async function set(code: number) {
    const res = await redis.set(key, code, {
      px: ms('15 minutes'),
    })
    if (res !== 'OK') {
      throw new Error("can't set redis key")
    }
  }

  async function get() {
    const res = await redis.get<number>(key)
    return res
  }

  async function remove() {
    const res = await redis.del(key)
    return !!res
  }

  return Object.freeze({
    exists,
    set,
    get,
    remove,
  })
}

const login = h().post(
  '/',
  zValidator('json', z.object({ email: zEmail })),
  async (c) => {
    const input = c.req.valid('json')

    const KVAuthClient = KVAuth(redis(c.env), 'login', input.email)
    const isCodeSent = await KVAuthClient.exists()
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

    await KVAuthClient.set(code)
    return c.json(r('OK'))
  }
)

const loginVerify = h().post(
  '/',
  zValidator(
    'json',
    z.object({
      email: zEmail,
      code: zReqString.length(6),
    })
  ),
  async (c) => {
    const input = c.req.valid('json')

    const KVAuthClient = KVAuth(redis(c.env), 'login', input.email)

    const code = await KVAuthClient.get()
    if (!code) {
      return c.json(r('CODE_EXPIRED'))
    }

    if (code.toString() !== input.code) {
      return c.json(r('CODE_NOT_MATCH'))
    }

    const deleteCode = await KVAuthClient.remove()
    if (!deleteCode) {
      throw new Error("can't delete redis key")
    }

    const [user] = await db(c.env)
      .select()
      .from(dbSchema.users)
      .where(eq(dbSchema.users.email, input.email))

    if (!user) {
      return c.json(r('USER_NOT_FOUND'))
    }

    const token = await generateAuthToken({ ...c.env, userId: user.id })
    setAuthCookie(c, c.env, token)

    return c.json(r('OK'))
  }
)

const register = h().post(
  '/',
  zValidator(
    'json',
    z.object({
      email: zEmail,
      name: zReqString,
    })
  ),
  async (c) => {
    const input = c.req.valid('json')

    const KVAuthClient = KVAuth(redis(c.env), 'register', input.email)

    const isCodeSent = await KVAuthClient.exists()
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

    await KVAuthClient.set(code)
    return c.json(r('OK'))
  }
)

const registerVerify = h().post(
  '/',
  zValidator(
    'json',
    z.object({
      email: zEmail,
      code: zReqString.length(6),
      name: zReqString,
    })
  ),
  async (c) => {
    const input = c.req.valid('json')

    const KVAuthClient = KVAuth(redis(c.env), 'register', input.email)

    const code = await KVAuthClient.get()
    if (!code) {
      return c.json(r('CODE_EXPIRED'))
    }

    if (code.toString() !== input.code) {
      return c.json(r('CODE_NOT_MATCH'))
    }

    const deleteCode = await KVAuthClient.remove()
    if (!deleteCode) {
      throw new Error("can't delete redis key")
    }

    const userId = genID()

    const user = await db(c.env).insert(dbSchema.users).values({
      id: userId,
      email: input.email,
      name: input.name,
    })
    if (!user) {
      throw new Error("can't create user")
    }

    const token = await generateAuthToken({ ...c.env, userId })
    setAuthCookie(c, c.env, token)

    return c.json(r('OK'))
  }
)

export const authRoute = h()
  .route('/login', login)
  .route('/register', register)
  .route('/login/verify', loginVerify)
  .route('/register/verify', registerVerify)
