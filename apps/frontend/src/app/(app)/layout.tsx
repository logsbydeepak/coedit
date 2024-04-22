import { toast, Toaster } from 'sonner'

import { Navbar } from '#/components/navbar'
import { QueryProvider } from '#/components/provider'
import { AppProvider } from '#/store/app'

import { AllDialog } from './all-dialog'
import { HandleUnauthorized } from './client-components'

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <>
      <QueryProvider>
        <AppProvider>
          <Navbar />
          {children}
          <AllDialog />
          <HandleUnauthorized />
        </AppProvider>
      </QueryProvider>
      <Toaster theme="dark" />
    </>
  )
}
