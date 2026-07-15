import { NextRequest, NextResponse } from 'next/server'
import { hc } from 'hono/client'

import type { AppType } from '@coedit/server'

import { env } from '#/env'

export async function proxy(req: NextRequest) {
  try {
    const url = req.url

    const token = req.cookies.get('x-auth')?.value
    const isAuth = await checkIsAuth(token)

    const { pathname } = req.nextUrl

    if (pathname.startsWith('/logout')) {
      const authCookie = req.cookies.get('auth')?.value
      const authParam = req.nextUrl.searchParams.get('auth')

      if (authCookie !== authParam) {
        return null
      }

      const response = NextResponse.next()
      response.cookies.delete('auth')
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

    return null
  } catch (error) {
    return NextResponse.error()
  }
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
  // `cookies()` from `next/headers` is not available inside Proxy, so we build
  // an `hc` client that forwards the token from the incoming request instead of
  // relying on `apiClient` (which reads cookies via `next/headers`).
  if (!token) return false

  try {
    const client = hc<AppType>(env.NEXT_PUBLIC_API_URL, {
      headers: { cookie: `x-auth=${token}` },
    })

    const res = await client.user.isAuth.$get()
    console.log({ res })
    if (!res.ok) return false

    const resData = await res.json()
    return resData.code === 'OK'
  } catch {
    return false
  }
}
