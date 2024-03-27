import { z } from 'zod'

export const zObject = z.object
export const zReqString = z.string().min(1)
export const zEmail = zReqString.email()
