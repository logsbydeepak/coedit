import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Provider } from 'jotai'

import { SetToken } from './components'
import { store } from './store'

export default function Layout({ children }: { children: React.ReactNode }) {
  const token = cookies().get('x-auth')?.value
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
