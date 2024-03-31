import * as jose from 'jose'
import { ENV, r } from './h'
import { redis, resend } from '@/lib/config'
import ms from 'ms'
import { setCookie } from 'hono/cookie'

import { Context } from 'hono'
function genExpTime(ExpMs: number) {
  return Date.now() + ExpMs
}
const maxAge = ms('30 days')

export async function checkIsAuth(env: ENV, token?: string) {
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

export const sendAuthEmail = (
  env: ENV,
  {
    email,
    code,
  }: {
    email: string
    code: number
  }
) => {
  const text = `coedit: code ${code}`
  return resend({
    RESEND_API_KEY: env.RESEND_API_KEY,
  }).emails.send({
    from: env.RESEND_FROM,
    to: email,
    subject: text,
    text,
  })
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
    .setExpirationTime(genExpTime(maxAge))
    .encrypt(secret)
}

export const setAuthCookie = (
  c: Context<{
    Bindings: ENV
  }>,
  token: string
) => {
  setCookie(c, 'x-auth', token, {
    httpOnly: true,
    path: '/',
    sameSite: 'Strict',
    secure: c.env.RUNTIME === 'production',
    maxAge,
  })
}

export const removeAuthCookie = (
  c: Context<{
    Bindings: ENV
  }>
) => {
  setCookie(c, 'x-auth', '', {
    httpOnly: true,
    path: '/',
    sameSite: 'Strict',
    secure: c.env.RUNTIME === 'production',
    maxAge: 0,
  })
}
