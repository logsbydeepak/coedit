'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { toast } from 'sonner'

import { apiClient } from '#/utils/hc-client'
import { withMinDelay } from '#/utils/with-min-delay'

import { Status, StatusContainer } from './components'
import { IDE } from './ide'
import { containerURLAtom } from './store'

export default function Page() {
  const [isReady, setIsReady] = useState(false)

  return isReady ? <IDE /> : <Init onReady={() => setIsReady(true)} />
}

function Init({ onReady }: { onReady: () => void }) {
  const params = useParams<{ id: string }>()
  const setContainerURL = useSetAtom(containerURLAtom)
  const router = useRouter()

  const startQuery = useQuery({
    queryKey: ['start', params.id],
    queryFn: async () => {
      const res = await withMinDelay(
        apiClient.project.start[':id'].$post({
          param: { id: params.id },
        })
      )

      const data = await res.json()

      if (data.code === 'PROJECT_IS_NOT_IDLE') {
        toast.error('Project is not IDLE')
        router.push('/')
      }

      return data
    },
    staleTime: 0,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  })

  const { data, isLoading, isError } = startQuery

  const isNotFound = data?.code === 'INVALID_PROJECT_ID'

  const message = isLoading ? 'loading' : isNotFound ? 'not found' : 'error'

  const showLoading = !isError && !isNotFound

  useEffect(() => {
    if (data?.code === 'OK') {
      setContainerURL({ api: data.api, output: data.output })
      onReady()
    }
  }, [data, setContainerURL, onReady])

  return (
    <StatusContainer className="absolute flex-col space-y-6 pt-14">
      <Status isLoading={showLoading}>{message}</Status>
      <p className="border-gray-6 bg-gray-3 text-gray-10 max-w-96 rounded-md border border-dashed p-2 text-center font-mono text-xs">
        if facing any issue, try refreshing the page, initializing the project
        might take a while
      </p>
    </StatusContainer>
  )
}
