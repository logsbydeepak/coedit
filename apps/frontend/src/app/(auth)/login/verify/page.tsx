import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { zEmail } from '@coedit/zschema'

import { Heading } from '../../_component'
import { Form } from './form'

export const metadata: Metadata = {
  title: 'Login code',
}

const schema = z.object({
  email: zEmail,
})

export default function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string }
}) {
  const parse = schema.safeParse(searchParams)
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
