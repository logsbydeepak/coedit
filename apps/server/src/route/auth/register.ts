import { zValidator } from '@hono/zod-validator'

import { db, dbSchema, eq } from '@coedit/db'
import { genID } from '@coedit/id'
import { KVAuthCode } from '@coedit/kv'
import { r } from '@coedit/r'
import { zRegisterUser, zVerifyRegisterUser } from '@coedit/zschema'

import {
  codeGenerator,
  generateAuthToken,
  sendAuthEmail,
  setAuthCookie,
} from '#/utils/auth'
import { redis } from '#/utils/config'
import { h } from '#/utils/h'

export const register = h().post(
  '/',
  zValidator('json', zRegisterUser),
  async (c) => {
    const input = c.req.valid('json')

    const KVAuthCodeClient = KVAuthCode(redis(c.env), 'REGISTER', input.email)

    const isCodeSent = await KVAuthCodeClient.exists()
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
      throw error
    }

    await KVAuthCodeClient.set(code)
    return c.json(r('OK'))
  }
)

export const registerVerify = h().post(
  '/',
  zValidator('json', zVerifyRegisterUser),
  async (c) => {
    const input = c.req.valid('json')

    const KVAuthCodeClient = KVAuthCode(redis(c.env), 'REGISTER', input.email)

    const code = await KVAuthCodeClient.get()
    if (!code) {
      return c.json(r('CODE_EXPIRED'))
    }

    if (code.toString() !== input.code) {
      return c.json(r('CODE_NOT_MATCH'))
    }

    const deleteCode = await KVAuthCodeClient.remove()
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
