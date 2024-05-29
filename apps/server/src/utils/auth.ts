import { Redis } from '@upstash/redis'
import { Context } from 'hono'
import { setCookie } from 'hono/cookie'
import * as jose from 'jose'
import ms from 'ms'
import { ErrorResponse as ErrorResponseType } from 'resend'

import { r } from '@coedit/r'

import { redis, resend } from '#/utils/config'

import { ENV } from './h'

const MAX_AGE = ms('30 days') / 1000

export async function checkIsAuth(
  env: Pick<
    ENV,
    'JWT_SECRET' | 'APP_UPSTASH_REDIS_REST_URL' | 'APP_UPSTASH_REDIS_REST_TOKEN'
  >,
  token?: string
) {
  try {
    if (!token) return r('NO_TOKEN')
    const secret = jose.base64url.decode(env.JWT_SECRET)
    const { payload } = await jose.jwtDecrypt(token, secret, {
      audience: 'auth',
    })
    if (!payload || !payload?.userId || typeof payload.userId !== 'string')
      return r('INVALID_PAYLOAD')

    const redisRes = await redis(env).exists(`logout:${token}`)
    if (redisRes === 1) return r('LOGGED_OUT')

    return r('OK', {
      userId: payload.userId,
      token: token,
    })
  } catch (error) {
    return r('ERROR')
  }
}

export const codeGenerator = () => Math.floor(100000 + Math.random() * 900000)

interface CreateEmailResponseSuccess {
  id: string
}
type ErrorResponse = ErrorResponseType & { statusCode: number }

interface CreateEmailResponse {
  data: CreateEmailResponseSuccess | null
  error: ErrorResponse | null
}

export function sendAuthEmail(
  env: Pick<ENV, 'RESEND_API_KEY' | 'RESEND_FROM'>,
  input: {
    email: string
    code: number
  }
) {
  const text = `code: ${input.code}`
  const resendClient = resend(env)

  return resendClient.emails.send({
    from: env.RESEND_FROM,
    to: input.email,
    subject: text,
    text,
  }) as Promise<CreateEmailResponse>
}

export const generateAuthToken = async ({
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
    .setExpirationTime(Date.now() + MAX_AGE)
    .encrypt(secret)
}

export const setAuthCookie = (
  c: Context,
  env: Pick<ENV, 'RUNTIME' | 'COOKIE_DOMAIN'>,
  token: string
) => {
  setCookie(c, 'x-auth', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'Strict',
    secure: env.RUNTIME === 'production',
    domain: env.COOKIE_DOMAIN,
    maxAge: MAX_AGE,
  })
}

export function KVAuth(
  redis: Redis,
  type: 'login' | 'register',
  email: string
) {
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
