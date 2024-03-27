import { z } from 'zod'

export const zEmail = z.string().email()
