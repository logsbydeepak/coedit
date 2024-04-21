'use client'

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'

export const queryClient = new QueryClient()

export const QueryProvider = ({ children }: React.PropsWithChildren) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
