'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '#/utils/hc-client'

import { Avatar } from './avatar'
import { LogoIcon } from './icons/logo'

export function Navbar() {
  return (
    <nav className="fixed inset-x-0 z-20 border-b border-gray-4 bg-gray-2">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between space-x-4 px-5">
        <Link
          className="flex cursor-pointer items-center justify-center space-x-1 text-sage-9"
          href="/"
        >
          <LogoIcon className="size-5" />
          <p className="text-center font-mono text-sm font-medium text-white">
            coedit
          </p>
        </Link>

        <User />
      </div>
    </nav>
  )
}

function User() {
  const { isLoading, data, isError } = useQuery({
    queryFn: async () => {
      const res = await apiClient.user.$get()
      return await res.json()
    },
    queryKey: ['user'],
    refetchOnMount: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    retry: 0,
  })

  if (isLoading) {
    return <div className="size-9 animate-pulse rounded-full bg-gray-4" />
  }

  if (!data?.name || isError) {
    return <p className="font-mono text-xs font-medium text-red-11">error</p>
  }

  return <Avatar name={data.name} className="size-9" />
}
