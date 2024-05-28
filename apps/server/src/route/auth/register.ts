import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { db, dbSchema } from '@coedit/db'
import { genID } from '@coedit/id'
import { r } from '@coedit/r'
import { zEmail, zReqString } from '@coedit/zschema'

import {
  codeGenerator,
  generateAuthToken,
  KVAuth,
  sendAuthEmail,
  setAuthCookie,
} from '#/utils/auth'
import { redis } from '#/utils/config'
import { h } from '#/utils/h'

export const register = h().post(
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

export const registerVerify = h().post(
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
