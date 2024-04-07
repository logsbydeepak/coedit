'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'

import { apiClient } from '#/utils/hc'

import { Avatar } from './avatar'
import { LogoIcon } from './icons/logo'

export function Navbar() {
  const { isLoading, data } = useQuery({
    queryFn: async () => {
      try {
        const res = await apiClient.user.$get()
        const resData = await res.json()
        return resData
      } catch (e) {
        throw new Error('Something went wrong!')
      }
    },
    queryKey: ['user'],
    throwOnError: true,
  })

  return (
    <nav className="fixed inset-x-0 border-b border-gray-4">
      <div className="flex h-14 w-full items-center justify-between space-x-4 px-5">
        <Link href="/">
          <div className="flex items-center justify-center space-x-1 text-sage-9">
            <LogoIcon className="size-5" />
            <p className="text-center font-mono text-sm font-medium text-white">
              coedit
            </p>
          </div>
        </Link>

        {isLoading && (
          <div className="size-9 animate-pulse rounded-full bg-gray-4" />
        )}

        {data?.name && (
          <div className="size-9">
            <Avatar name={data.name} />
          </div>
        )}
      </div>
    </nav>
  )
}
