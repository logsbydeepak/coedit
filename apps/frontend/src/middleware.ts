import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { serverClient } from './utils/hc'
import { apiClient } from './utils/hc-server'

export async function middleware(req: NextRequest) {
  try {
    const url = req.url
    const token = cookies().get('x-auth')?.value
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
    return null
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
  try {
    if (!token) return false
    const res = await apiClient.user.isAuth.$get()
    const resData = await res.json()

    if (resData.code === 'OK') {
      return true
    }
    return false
  } catch (error) {
    throw new Error('Something went wrong.')
  }
}
