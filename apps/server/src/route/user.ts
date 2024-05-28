import { eq } from 'drizzle-orm'

import { db, dbSchema } from '@coedit/db'
import { r } from '@coedit/r'

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
  return c.json(
    r('OK', {
      id: c.get('x-userId'),
    })
  )
})

export const userRoute = h().route('/', user).route('/isAuth', isAuth)
