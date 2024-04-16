import { eq } from 'drizzle-orm'

import { r } from '@coedit/r'

import { db, dbSchema } from '#/db'
import { h, hAuth } from '#/utils/h'

const user = hAuth().get('/', async (c) => {
  const userId = c.get('x-userId')

  const [user] = await db(c.env)
    .select()
    .from(dbSchema.users)
    .where(eq(dbSchema.users.id, userId))

  if (!user) {
    throw new Error('User not found')
  }

  return c.json(
    r('OK', {
      email: user.email,
      name: user.name,
    })
  )
})

const isAuth = hAuth().get('/', async (c) => {
  return c.json(r('OK'))
})

// const logout = hAuth().patch('/', async (c) => {
//   const userId = c.get('x-userId')
//   const token = c.get('x-auth')
//   const redisRes = await redis(c.env).set(`logout:${token}`, userId)
//   if (redisRes !== 'OK') throw new Error('Failed to set logout token in redis')

//   removeAuthCookie(c)
//   return c.json(r('OK'))
// })

export const userRoute = h().route('/', user).route('/isAuth', isAuth)
