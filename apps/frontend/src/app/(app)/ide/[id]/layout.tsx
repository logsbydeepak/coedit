'use client'

import { Provider } from 'jotai'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>
}
