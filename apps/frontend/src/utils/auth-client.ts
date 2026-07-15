import { createAuthClient } from 'better-auth/react'

import { env } from '#/env'

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_API_URL,
  basePath: '/auth',
})

type GoogleAuthOptions = {
  requestSignUp?: boolean
}

export function signInWithGoogle({ requestSignUp }: GoogleAuthOptions = {}) {
  return authClient.signIn.social({
    provider: 'google',
    requestSignUp,
    callbackURL: `${window.location.origin}/`,
    errorCallbackURL: `${window.location.origin}/home`,
  })
}
