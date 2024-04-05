'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'

import { zEmail, zReqString } from '@coedit/zschema'

const schema = z.object({
  email: zEmail,
  name: zReqString,
})

export default function Layout({ children }: React.PropsWithChildren) {
  const router = useRouter()

  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const name = searchParams.get('name')

  const data = schema.safeParse({
    email,
    name,
  })

  React.useEffect(() => {
    if (!data.success) {
      router.push('/')
    }
  }, [data.success, router])

  if (!data.success) {
    return null
  }

  return children
}
