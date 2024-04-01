import React from 'react'

export function Heading({ children }: React.PropsWithChildren) {
  return <h1 className="text-xl font-medium text-center">{children}</h1>
}
