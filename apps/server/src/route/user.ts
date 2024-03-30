import { db, dbSchema } from '@/db'
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
