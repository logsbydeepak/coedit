import { h } from '@/utils/h'

export const userRoute = h().get('/', (c) => {
  return c.text('ok')
})
