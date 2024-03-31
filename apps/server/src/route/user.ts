import { db, dbSchema } from '@/db'
import { redis } from '@/lib/config'
import { removeAuthCookie } from '@/utils/auth'
import { hAuth, r } from '@/utils/h'
import { eq } from 'drizzle-orm'

export const userRoute = hAuth().get('/', async (c) => {
  const userId = c.get('x-userId')

  const [user] = await db(c.env)
    .select()
    .from(dbSchema.users)
    .where(eq(dbSchema.users.email, userId))
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

export const logout = hAuth().patch('/', async (c) => {
  const userId = c.get('x-userId')
  const token = c.get('x-auth')
  const redisRes = await redis(c.env).set(`logout:${token}`, userId)
  if (redisRes !== 'OK') throw new Error('Failed to set logout token in redis')

  removeAuthCookie(c)
  return c.json(r('OK'))
})
