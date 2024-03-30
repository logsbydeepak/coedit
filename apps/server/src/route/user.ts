import { hAuth } from '@/utils/h'

export const userRoute = hAuth().get('/', (c) => {
  const userId = c.get('x-userId')
  return c.text('ok')
})
