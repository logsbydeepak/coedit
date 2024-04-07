import { Navbar } from '#/components/navbar'
import { QueryProvider } from '#/components/provider'
import { AppProvider } from '#/store/app'

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <>
      <QueryProvider>
        <AppProvider>
          <Navbar />
          <div className="mx-auto max-w-7xl px-5 pt-14">{children}</div>
        </AppProvider>
      </QueryProvider>
    </>
  )
}
