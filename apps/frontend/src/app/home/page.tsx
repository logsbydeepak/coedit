'use client'

import React from 'react'

import { Alert, useAlert } from '#/components/icons/alert'
import { LogoIcon } from '#/components/icons/logo'
import { Button } from '#/components/ui/button'
import { signInWithGoogle } from '#/utils/auth-client'

export default function Page() {
  const [isSignInPending, startSignInTransition] = React.useTransition()
  const [isSignUpPending, startSignUpTransition] = React.useTransition()
  const { alert, setAlert } = useAlert()

  React.useEffect(() => {
    const error = new URLSearchParams(window.location.search).get('error')
    if (!error) return

    setAlert({
      type: 'destructive',
      message:
        error === 'signup_disabled'
          ? "No account found. Use 'Sign up with Google' to create one."
          : 'Something went wrong. Please try again.',
    })

    // Clean the error param from the URL.
    window.history.replaceState(null, '', window.location.pathname)
  }, [setAlert])

  function handleSignIn() {
    startSignInTransition(async () => {
      await signInWithGoogle()
    })
  }

  function handleSignUp() {
    startSignUpTransition(async () => {
      await signInWithGoogle({ requestSignUp: true })
    })
  }

  return (
    <div className="absolute flex min-h-full w-full items-center justify-center">
      <div className="flex w-80 flex-col space-y-6 p-4">
        <div className="text-sage-9 flex items-center justify-center space-x-2">
          <LogoIcon className="size-6" />
          <p className="text-center font-mono text-xl font-medium text-white">
            coedit
          </p>
        </div>

        <Alert {...alert} align="center" />

        <div className="space-y-3">
          <Button
            intent="primary"
            className="w-full font-mono"
            onClick={handleSignIn}
            isLoading={isSignInPending}
            disabled={isSignUpPending}
          >
            Sign in with Google
          </Button>

          <Button
            intent="secondary"
            className="w-full font-mono"
            onClick={handleSignUp}
            isLoading={isSignUpPending}
            disabled={isSignInPending}
          >
            Sign up with Google
          </Button>
        </div>

        <p className="text-gray-11 text-center text-xs">
          Sign in if you already have an account, or sign up to create a new
          one.
        </p>
      </div>
    </div>
  )
}
