'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import ms from 'ms'

import { apiClient } from '#/utils/hc-client'

import { Status, StatusContainer } from './components'
import { IDE } from './ide'
import { publicIPAtom } from './store'

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
    queryKey: [undefined],
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
    queryKey: [undefined],
    refetchInterval: ms('4s'),
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
    <StatusContainer className="absolute pt-14">
      <Status
        isLoading={
          !isError &&
          (findQuery.data?.code !== 'INVALID_PROJECT_ID' ||
            statusQuery.data?.code !== 'INVALID_PROJECT_ID')
        }
      >
        {message}
      </Status>
    </StatusContainer>
  )
}
