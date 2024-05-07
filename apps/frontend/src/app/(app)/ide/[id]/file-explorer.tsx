'use client'

import { useQuery } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'

import { publicIPAtom } from '../store'
import { apiClient } from './utils'

export default function FileExplorer() {
  const publicIP = useAtomValue(publicIPAtom)
  const {} = useQuery({
    queryFn: async () => {
      const res = await apiClient(publicIP).fileExplorer.$post({
        json: {
          include: ['/', '/app', '/test'],
        },
      })
      return await res.json()
    },
    queryKey: ['file-explorer'],
  })

  return <h1>File Explorer</h1>
}
