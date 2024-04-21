'use client'

import { useQuery } from '@tanstack/react-query'

import { apiClient } from '#/utils/hc-client'

export function Templates() {
  const { isLoading, data } = useQuery({
    queryFn: async () => {
      try {
        const res = await apiClient.template.$get()
        const resData = await res.json()
        return resData
      } catch (e) {
        throw new Error('Something went wrong!')
      }
    },
    queryKey: ['templates'],
    throwOnError: true,
  })

  if (isLoading) {
    return <p>Loading...</p>
  }

  return (
    <>
      {data?.projects.map((project) => (
        <div key={project.id}>{project.name}</div>
      ))}
    </>
  )
}
