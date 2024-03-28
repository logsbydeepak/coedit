import { Resend } from 'resend'

export const resend = ({ RESEND_API_KEY }: { RESEND_API_KEY: string }) => {
  return new Resend(RESEND_API_KEY)
}
