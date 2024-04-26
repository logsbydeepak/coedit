'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { LoaderIcon } from 'lucide-react'

import { apiClient } from '#/utils/hc-client'

export default function Page() {
  const params = useParams<{ id: string }>()

  const findQuery = useQuery({
    queryFn: async () => {
      const res = await apiClient.project.start[':id'].$post({
        param: {
          id: params.id,
        },
      })

      return await res.json()
    },
    queryKey: [''],
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  })

  const statusQuery = useQuery({
    queryFn: async () => {
      const res = await apiClient.project.status[':id'].$get({
        param: {
          id: params.id,
        },
      })

      return await res.json()
    },
    enabled: findQuery.data?.code === 'OK',
    queryKey: ['status'],
    refetchInterval: 4000,
  })

  const isError = React.useMemo(
    () => findQuery.isError || statusQuery.isError,
    [findQuery.isError, statusQuery.isError]
  )

  const message: string = React.useMemo(() => {
    if (findQuery.isLoading || statusQuery.isLoading) {
      return 'loading'
    }

    if (isError) {
      return 'error'
    }

    if (
      findQuery.data?.code === 'INVALID_PROJECT_ID' ||
      statusQuery.data?.code === 'INVALID_PROJECT_ID'
    ) {
      return 'not found'
    }

    if (statusQuery.data?.code === 'OK') {
      if (statusQuery.data.status === 'RUNNING') {
        return 'running'
      }
    }

    return 'error'
  }, [
    findQuery.isLoading,
    statusQuery.isLoading,
    isError,
    findQuery.data?.code,
    statusQuery.data,
  ])

  return (
    <Container>
      <Status
        isLoading={
          !isError ||
          findQuery.data?.code !== 'INVALID_PROJECT_ID' ||
          statusQuery.data?.code !== 'INVALID_PROJECT_ID'
        }
      >
        {message}
      </Status>
    </Container>
  )
}

function Container({ children }: React.HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <div className="absolute flex min-h-full w-full items-center justify-center pt-14 text-center">
      {children}
    </div>
  )
}

function Status({
  children,
  isLoading,
}: React.PropsWithChildren<{ isLoading: boolean }>) {
  return (
    <div className="flex items-center space-x-2 rounded-full bg-gray-5 px-5 py-2 font-mono text-sm">
      {isLoading && <LoaderIcon className="size-4 animate-spin text-gray-11" />}
      <p>{children}</p>
    </div>
  )
}