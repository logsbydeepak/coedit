import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { r, tryCatch } from '@coedit/r'

import { apiClient } from './utils/hc-server'
import { log } from './utils/log'

const AUTH_COOKIE_NAME = 'x-auth'

export async function proxy(req: NextRequest) {
  const url = req.url

  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  const authRes = await tryCatch(checkIsAuth(token))
  if (authRes.error) {
    log.error({ error: authRes.error }, 'AUTH_ERROR')
    return NextResponse.error()
  }

  if (authRes.data.code !== 'OK' && authRes.data.code !== 'TOKEN_REQUIRED') {
    log.error({ error: authRes.data }, 'AUTH_ERROR')
    return NextResponse.error()
  }

  const isAuth =
    authRes.data.code === 'TOKEN_REQUIRED' ? false : authRes.data.isAuth

  const { pathname } = req.nextUrl

  if (pathname.startsWith('/logout')) {
    const authCookie = req.cookies.get(AUTH_COOKIE_NAME)?.value
    const authParam = req.nextUrl.searchParams.get(AUTH_COOKIE_NAME)

    if (authCookie !== authParam) {
      log.warn(
        { provided: !!authParam, stored: !!authCookie },
        'LOGOUT_AUTH_MISMATCH'
      )
      return NextResponse.error()
    }

    const response = NextResponse.next()
    response.cookies.delete(AUTH_COOKIE_NAME)
    return response
  }

  const isIndexPage = pathname === '/'

  const isAuthPage =
    pathname.startsWith('/login') || pathname.startsWith('/register')

  const isAppPage = pathname.startsWith('/app') || pathname.startsWith('/ide')

  if (isAuth) {
    if (isIndexPage) {
      return NextResponse.rewrite(new URL('/app', url))
    }

    if (isAuthPage) {
      return NextResponse.redirect(new URL('/', url))
    }
  }

  if (!isAuth) {
    if (isIndexPage) {
      return NextResponse.rewrite(new URL('/home', url))
    }

    if (isAppPage) {
      return NextResponse.redirect(new URL('/login', url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',

    '/login/:path*',
    '/register/:path*',

    '/app/:path*',
    '/ide/:path*',
  ],
}

async function checkIsAuth(token?: string) {
  if (!token) return r('TOKEN_REQUIRED')
  const res = await tryCatch(apiClient.user.isAuth.$get())

  if (res.error) {
    return r('ERROR_RES', { error: res.error })
  }

  const resData = await tryCatch(res.data.json())
  if (resData.error) {
    return r('ERROR_PARSING_JSON', { error: resData.error })
  }

  return r('OK', { isAuth: resData.data.code === 'OK' })
}
