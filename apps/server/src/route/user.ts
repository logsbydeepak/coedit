import { r } from '@coedit/r'

import { h, hAuth } from '#/utils/h'

const user = hAuth().get('/', async (c) => {
  return c.json(
    r('OK', {
      email: c.get('user').email,
      name: c.get('user').name,
    })
  )
})

const isAuth = hAuth().get('/', async (c) => {
  return c.json(
    r('OK', {
      id: c.get('user').id,
    })
  )
})

export const userRoute = h().route('/', user).route('/isAuth', isAuth)
