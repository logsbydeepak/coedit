import { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { z, zEmail, zReqString } from '@coedit/zschema'

import { Heading } from '../../_component'
import { Form } from './form'

export const metadata: Metadata = {
  title: 'Register code',
}

const schema = z.object({
  email: zEmail,
  name: zReqString,
})

export default function Page({
  searchParams,
}: {
  searchParams: {
    [key: string]: string
  }
}) {
  const parse = schema.safeParse(searchParams)
  if (!parse.success) {
    redirect('/register')
  }

  return (
    <>
      <Heading>Enter code to register</Heading>
      <Form {...parse.data} />
    </>
  )
}
