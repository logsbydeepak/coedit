import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'

import { cn } from '#/utils/style'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={cn(inter.className, 'bg-gray-2 text-gray-12')}>
        {children}
      </body>
    </html>
  )
}
