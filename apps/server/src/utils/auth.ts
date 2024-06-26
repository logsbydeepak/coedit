import { Context } from 'hono'
import { setCookie } from 'hono/cookie'
import * as jose from 'jose'
import ms from 'ms'
import { ErrorResponse as ErrorResponseType } from 'resend'

import { r } from '@coedit/r'

import { resend } from '#/utils/config'

import { ENV } from './h'

const MAX_AGE = ms('30 days') / 1000

export async function checkIsAuth(
  env: Pick<ENV, 'JWT_SECRET'>,
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
