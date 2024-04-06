import { Navbar } from '#/components/navbar'

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
