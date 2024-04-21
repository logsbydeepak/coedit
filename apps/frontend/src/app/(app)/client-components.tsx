'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

import { queryClient } from '#/components/provider'

export function HandleUnauthorized() {
  const router = useRouter()

  React.useEffect(() => {
    const handleUnauthorized = () => {
      queryClient.clear()
      router.push('/login')
    }

    window.addEventListener('UNAUTHORIZED', handleUnauthorized)
    return () => window.removeEventListener('UNAUTHORIZED', handleUnauthorized)
  }, [router])

  return null
}
