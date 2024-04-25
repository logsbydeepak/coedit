'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { LoaderIcon } from 'lucide-react'

import { apiClient } from '#/utils/hc-client'
import { cn } from '#/utils/style'

export default function Page() {
  const params = useParams<{ id: string }>()

  const { isLoading, isError, data } = useQuery({
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

  if (isLoading) {
    return (
      <Container>
        <LoaderIcon className="size-6 animate-spin text-gray-9" />
      </Container>
    )
  }

  if (isError || !data || !data?.code) {
    return (
      <Container>
        <Message className="text-red-11">error</Message>
      </Container>
    )
  }

  if (data.code === 'INVALID_PROJECT_ID')
    return (
      <Container>
        <Message>No projects found</Message>
      </Container>
    )

  return (
    <Container>
      <Status />
    </Container>
  )
}

function Message({
  className,
  children,
}: React.HtmlHTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'p-10 text-center font-mono text-sm font-medium text-gray-11',
        className
      )}
    >
      {children}
    </p>
  )
}

function Container({ children }: React.HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <div className="absolute flex min-h-full w-full items-center justify-center pt-14 text-center">
      {children}
    </div>
  )
}

function Status() {
  return <h1>STATUS</h1>
}
