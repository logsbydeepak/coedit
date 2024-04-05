'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { zEmail } from '@coedit/zschema'

export default function Layout({ children }: React.PropsWithChildren) {
  const router = useRouter()

  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const isValid = zEmail.safeParse(email)

  React.useEffect(() => {
    if (!isValid.success) {
      router.push('/')
    }
  }, [isValid.success, router])

  if (!isValid.success) {
    return null
  }

  return children
}
