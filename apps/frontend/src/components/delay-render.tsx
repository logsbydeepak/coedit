'use client'

import React from 'react'

export function DelayRender({ children }: React.PropsWithChildren) {
  const [isReady, setIsReady] = React.useState(false)

  React.useEffect(() => {
    setIsReady(true)
  }, [])

  if (!isReady) {
    return null
  }

  return children
}
