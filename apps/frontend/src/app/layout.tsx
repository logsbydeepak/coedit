import type { Metadata } from 'next'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'

import './globals.css'

import { cn } from '#/utils/style'

export const metadata: Metadata = {
  title: 'coedit',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          GeistSans.variable,
          GeistMono.variable,
          'bg-gray-2 text-gray-12'
        )}
      >
        {children}
      </body>
    </html>
  )
}
