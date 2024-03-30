import { hAuth } from '@/utils/h'

export const userRoute = hAuth().get('/', (c) => {
  const userId = c.get('x-userId')
  console.log(userId)
  throw new Error('Something went wrong!')
  return c.text('ok')
})
