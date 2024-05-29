import { z as _z } from 'zod'

export const zNumber = _z.number()
export const zReqString = _z.string().min(1, { message: 'required' })
export const zEmail = zReqString.email()
export const z = _z
