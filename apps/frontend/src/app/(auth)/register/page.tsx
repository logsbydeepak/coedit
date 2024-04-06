import { Metadata } from 'next'

import { Heading } from '../_component'
import { Form } from './form'

export const metadata: Metadata = {
  title: 'Register',
}

export default function Page() {
  return (
    <>
      <Heading>Create new account</Heading>
      <Form />
    </>
  )
}
