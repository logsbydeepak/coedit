'use client'

import { useQuery } from '@tanstack/react-query'

import { apiClient } from '#/utils/hc'

import { LogoIcon } from './icons/logo'

export function Navbar() {
  // const { isLoading, data } = useQuery({
  //   queryFn: async () => {
  //     try {
  //       const res = await apiClient.user.$get()
  //       const resData = await res.json()
  //       return resData
  //     } catch (e) {
  //       throw new Error('Something went wrong!')
  //     }
  //   },
  //   queryKey: ['user'],
  //   throwOnError: true,
  // })

  return (
    <nav className="fixed inset-x-0">
      <div className="flex h-14 w-full items-center justify-between space-x-4 px-5">
        <div className="flex items-center justify-center space-x-2 text-sage-9">
          <LogoIcon className="size-6" />
          <p className="text-center font-mono text-xl font-medium text-white">
            coedit
          </p>
        </div>

        {/* {isLoading && ( */}
        {/*   <div className="h-7 w-24 animate-pulse rounded-md bg-gray-4" /> */}
        {/* )} */}
        {/**/}
        {/* {data?.name && ( */}
        {/*   <p className="max-w-20 overflow-hidden text-ellipsis text-nowrap text-sm"> */}
        {/*     {data.name} */}
        {/*   </p> */}
        {/* )} */}
      </div>
    </nav>
  )
}
