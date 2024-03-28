import { Hono } from 'hono'
import { zEmail, zObject } from '@coedit/package-zschema'
import { zValidator } from '@hono/zod-validator'
import { db, dbSchema } from '../db'
import { env } from 'hono/adapter'
import { eq } from 'drizzle-orm'
import { resend } from '../lib/config'

type ENV = {
  RESEND_API_KEY: string
  RESEND_FROM: string
  DB_URL: string
}

const zUserEmail = zObject({
  email: zEmail,
})

export const usersApp = new Hono()
  .get('/', async (c) => {
    return c.text('HI')
  })
  .post(
    '/login',
    zValidator('json', zUserEmail, (data, c) => {
      if (!data.success) {
        return c.json({ error: 'invalid email' })
      }

      return c.text('login')
    })
  )
  .post(
    '/register',
    zValidator('json', zUserEmail, async (data, c) => {
      if (!data.success) {
        return c.json({ error: 'invalid email' })
      }
      const input = data.data

      const { DB_URL, RESEND_API_KEY, RESEND_FROM } = env<ENV>(c)
      const isUserExist = await db(DB_URL)
        .select()
        .from(dbSchema.users)
        .where(eq(dbSchema.users.email, input.email))

      if (isUserExist.length !== 0) {
        return c.json({ error: 'user already exist' })
      }

      const { data: email_res, error } = await resend({
        RESEND_API_KEY: RESEND_API_KEY,
      }).emails.send({
        from: RESEND_FROM,
        to: input.email,
        subject: `coedit: code `,
        text: `coedit: code `,
      })

      if (error) {
        throw new Error("can't send email")
      }

      return c.text('register')
    })
  )
