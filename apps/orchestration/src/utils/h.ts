import { Hono } from 'hono'
import type { Context } from 'hono'

import { r } from '@coedit/r'

const hono = () => new Hono()

export const h = () => hono()

export const validationHook = (result: { success: boolean }, c: Context) => {
  if (!result.success) return c.json(r('VALIDATION_ERROR'), 400)
}
