import { Metadata } from 'next'

import { Heading } from '../_component'
import { Form } from './form'

export const metadata: Metadata = {
  title: 'Login',
}

export default function Page() {
  return (
    <>
      <Heading>Welcome back</Heading>
      <Form />
    </>
  )
}
