import * as z from 'zod'

export { z }

export const zNumber = z.number()
export const zReqString = z.string().min(1, { message: 'required' })
export const zEmail = z.email()

export const zRegisterUser = z.object({
  email: zEmail,
  name: zReqString,
})

export const zVerifyRegisterUser = z.object({
  email: zEmail,
  name: zReqString,
  code: zReqString,
})

export const zLoginUser = z.object({
  email: zEmail,
})

export const zVerifyLoginUser = z.object({
  email: zEmail,
  code: zReqString,
})

export const zCreateProject = z.object({
  templateId: zReqString,
  name: zReqString,
})
