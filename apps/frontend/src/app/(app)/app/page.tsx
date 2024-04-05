'use client'

import { useQuery } from '@tanstack/react-query'

import { Head } from '#/components/head'
import { apiClient } from '#/utils/hc'

export default function Page() {
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
  })

  return (
    <>
      <Head title="App" />

      {isLoading && <p>Loading...</p>}

      {data?.name && (
        <div>
          <p>user: {data.name}</p>
          <p>email: {data.email}</p>
        </div>
      )}

      <h1>App</h1>
    </>
  )
}
