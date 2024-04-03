import React from 'react'

export function Heading({ children }: React.PropsWithChildren) {
  return <h1 className="text-center text-xl font-medium">{children}</h1>
}
