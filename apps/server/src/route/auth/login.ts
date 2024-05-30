import { zValidator } from '@hono/zod-validator'

import { db, dbSchema, eq } from '@coedit/db'
import { r } from '@coedit/r'
import { zLoginUser, zVerifyLoginUser } from '@coedit/zschema'

import {
  codeGenerator,
  generateAuthToken,
  KVAuth,
  sendAuthEmail,
  setAuthCookie,
} from '#/utils/auth'
import { redis } from '#/utils/config'
import { h } from '#/utils/h'

export const login = h().post(
  '/',
  zValidator('json', zLoginUser),
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

export const loginVerify = h().post(
  '/',
  zValidator('json', zVerifyLoginUser),
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
