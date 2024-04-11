import { Navbar } from '#/components/navbar'
import { QueryProvider } from '#/components/provider'
import { AppProvider } from '#/store/app'

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <>
      <QueryProvider>
        <AppProvider>
          <Navbar />
          {children}
        </AppProvider>
      </QueryProvider>
    </>
  )
}
