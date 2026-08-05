'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAtom, useSetAtom } from 'jotai'
import {
  CircleAlertIcon,
  SearchXIcon,
  ServerCrashIcon,
  type LucideIcon,
} from 'lucide-react'

import { Banner } from '#/components/ui/banner'
import { apiClient } from '#/utils/hc-client'
import { cn } from '#/utils/style'

import { Status, StatusContainer } from './components'
import { IDE } from './ide'
import { containerURLAtom, ideActiveAtom } from './store'

const STATUS_POLL_INTERVAL_MS = 2000

export default function Page() {
  const [isReady, setIsReady] = useAtom(ideActiveAtom)

  useEffect(() => {
    return () => setIsReady(false)
  }, [setIsReady])

  return isReady ? <IDE /> : <Init onReady={() => setIsReady(true)} />
}

function Init({ onReady }: { onReady: () => void }) {
  const params = useParams<{ id: string }>()
  const setContainerURL = useSetAtom(containerURLAtom)

  // 1. Kick off the start. This only *initiates* the project; the container is
  // spun up in the background, so success here is `INITIATING`.
  const startQuery = useQuery({
    queryKey: ['start', params.id],
    queryFn: async () => {
      const res = await apiClient.project.start[':id'].$post({
        param: { id: params.id },
      })

      return res.json()
    },
    staleTime: 0,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  })

  const isInitiating = startQuery.data?.code === 'INITIATING'

  // 2. Once initiating, poll the status until the container reports RUNNING and
  // hands back the urls (or a terminal failure).
  const statusQuery = useQuery({
    queryKey: ['status', params.id],
    enabled: isInitiating,
    queryFn: async () => {
      const res = await apiClient.project.status[':id'].$post({
        param: { id: params.id },
      })

      return res.json()
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      // Stop polling on any terminal state.
      const code = query.state.data?.code
      if (
        code === 'RUNNING' ||
        code === 'NOT_RUNNING' ||
        code === 'ERROR' ||
        code === 'INVALID_PROJECT_ID'
      ) {
        return false
      }
      return STATUS_POLL_INTERVAL_MS
    },
  })

  useEffect(() => {
    const data = statusQuery.data
    if (data?.code === 'RUNNING') {
      setContainerURL({ api: data.api, output: data.output })
      onReady()
    }
  }, [statusQuery.data, setContainerURL, onReady])

  const startData = startQuery.data
  const statusData = statusQuery.data

  const isNotFound =
    startData?.code === 'INVALID_PROJECT_ID' ||
    statusData?.code === 'INVALID_PROJECT_ID'

  const noInstance = startData?.code === 'NO_INSTANCE_AVAILABLE'

  const isError =
    startQuery.isError ||
    statusQuery.isError ||
    startData?.code === 'ERROR' ||
    statusData?.code === 'ERROR' ||
    statusData?.code === 'NOT_RUNNING'

  const isFailed = isNotFound || noInstance || isError

  const message = isNotFound
    ? 'project not found'
    : noInstance
      ? 'no capacity, retry later'
      : isError
        ? 'failed to start'
        : 'starting'

  const Icon: LucideIcon | undefined = isNotFound
    ? SearchXIcon
    : noInstance
      ? ServerCrashIcon
      : isError
        ? CircleAlertIcon
        : undefined

  return (
    <StatusContainer className="absolute flex-col space-y-6 pt-14">
      <Status
        isLoading={!isFailed}
        Icon={Icon}
        className={cn(
          'max-w-[90vw] text-center sm:max-w-md',
          isFailed && 'text-red-11'
        )}
      >
        {message}
      </Status>

      <Banner className="max-w-[90vw] sm:max-w-96">
        Note: this is a personal/portfolio project. To keep it running
        affordably, idle environments are shut down automatically, so the first
        launch can take a while. If it seems stuck, try refreshing.
      </Banner>
    </StatusContainer>
  )
}
