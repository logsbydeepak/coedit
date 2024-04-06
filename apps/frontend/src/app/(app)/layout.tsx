import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { Navbar } from '#/components/navbar'
import { AppProvider } from '#/store/app'

export default function Layout({ children }: React.PropsWithChildren) {
  const authToken = cookies().get('x-auth')?.value

  if (!authToken) {
    redirect('/login')
  }

  return (
    <>
      <AppProvider initialProps={{ authToken }}>
        <Navbar />
        {children}
      </AppProvider>
    </>
  )
}
