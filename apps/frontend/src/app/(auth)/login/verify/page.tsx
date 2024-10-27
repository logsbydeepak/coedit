import { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { z, zEmail } from '@coedit/zschema'

import { Heading } from '../../_component'
import { Form } from './form'

export const metadata: Metadata = {
  title: 'Login code',
}

const schema = z.object({
  email: zEmail,
})

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string }>
}) {
  const parse = schema.safeParse(await searchParams)
  if (!parse.success) {
    redirect('/login')
  }

  return (
    <>
      <Heading>Enter code to login</Heading>
      <Form {...parse.data} />
    </>
  )
}
