'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import ms from 'ms'

import { apiClient } from '#/utils/hc-client'

import { Status, StatusContainer } from './components'
import { IDE } from './ide'
import { containerURLAtom } from './store'

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
  const setContainerURL = useSetAtom(containerURLAtom)

  const startQuery = useQuery({
    queryFn: async () => {
      const res = await apiClient.project.start[':id'].$post({
        param: {
          id: params.id,
        },
      })
      return await res.json()
    },
    queryKey: ['start', params.id],
    staleTime: 0,
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
    staleTime: 0,
    enabled: startQuery.data?.code === 'OK',
    queryKey: ['status', params.id],
    refetchInterval: ms('4s'),
  })

  const isError = React.useMemo(
    () => startQuery.isError || statusQuery.isError,
    [startQuery.isError, statusQuery.isError]
  )

  const message: string = React.useMemo(() => {
    if (startQuery.isLoading || statusQuery.isLoading) {
      return 'loading'
    }

    if (isError) {
      return 'error'
    }

    if (startQuery.data?.code === 'TIMEOUT') {
      return 'timeout'
    }

    if (
      startQuery.data?.code === 'INVALID_PROJECT_ID' ||
      statusQuery.data?.code === 'INVALID_PROJECT_ID'
    ) {
      return 'not found'
    }

    if (statusQuery.data?.code === 'STATUS') {
      return statusQuery.data.status.toLowerCase()
    }

    return 'error'
  }, [
    startQuery.isLoading,
    statusQuery.isLoading,
    isError,
    startQuery.data?.code,
    statusQuery.data,
  ])

  const isLoading: boolean = React.useMemo(() => {
    if (isError) return false

    if (startQuery.data?.code === 'TIMEOUT') {
      return false
    }

    if (startQuery.data?.code === 'INVALID_PROJECT_ID') {
      return false
    }

    if (statusQuery.data?.code === 'INVALID_PROJECT_ID') {
      return false
    }

    return true
  }, [isError, startQuery.data?.code, statusQuery.data?.code])

  React.useEffect(() => {
    if (statusQuery.data?.code === 'OK') {
      setContainerURL({
        api: statusQuery.data.api,
        output: statusQuery.data.output,
      })
      setIsReady(true)
      return
    }
  }, [statusQuery.data, setIsReady, setContainerURL])

  return (
    <StatusContainer className="absolute flex-col space-y-6 pt-14">
      <Status isLoading={isLoading}>{message}</Status>
      <p className="max-w-96 rounded-md border border-dashed border-gray-6 bg-gray-3 p-2 text-center font-mono text-xs text-gray-10">
        if facing any issue, try refreshing the page, initializing the project
        might take a while
      </p>
    </StatusContainer>
  )
}
