import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Provider } from 'jotai'

import { SetToken } from './components'
import { store } from './store'

export const metadata: Metadata = {
  title: 'Project',
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('x-auth')?.value
  if (!token) {
    redirect('/login')
  }
  return (
    <Provider store={store}>
      <SetToken token={token} />
      {children}
    </Provider>
  )
}
