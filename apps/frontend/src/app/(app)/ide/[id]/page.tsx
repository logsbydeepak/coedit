'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { LoaderIcon } from 'lucide-react'

import { apiClient } from '#/utils/hc-client'

import { publicIPAtom } from '../store'
import { IDE } from './ide'

export default function Page() {
  const [isReady, setIsReady] = React.useState(false)

  if (!isReady) {
    return <Init setIsReady={setIsReady} />
  }

  return <IDE />
}

function Init({
  setIsReady,
}: {
  setIsReady: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const params = useParams<{ id: string }>()
  const setPublicIP = useSetAtom(publicIPAtom)

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
      if (!('publicIP' in statusQuery.data)) {
        return statusQuery.data.status.toLowerCase()
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

  React.useEffect(() => {
    if (statusQuery.data?.code === 'OK') {
      if ('publicIP' in statusQuery.data) {
        setPublicIP(statusQuery.data.publicIP)
        setIsReady(true)
        return
      }
    }
  }, [statusQuery.data, setIsReady, setPublicIP])

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
