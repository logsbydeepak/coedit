import { z } from 'zod'

export const zNumber = z.number()
export const zObject = z.object
export const zReqString = z.string().min(1, { message: 'required' })
export const zEmail = zReqString.email()
