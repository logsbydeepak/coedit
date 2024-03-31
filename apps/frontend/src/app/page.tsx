'use client'

import { apiClient } from '@/utils/hc'
import { useQuery } from '@tanstack/react-query'

export default function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: apiClient.user.$get,
  })

  return <h1>hi</h1>
}
