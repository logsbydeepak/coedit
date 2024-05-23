import { r } from '@coedit/r'

import { env } from '#/env'

export function getSubdomain(url: string) {
  try {
    const parsedURL = new URL(url)
    const hostname = parsedURL.hostname

    const split = hostname.split('.')
    if (split.length === 0) {
      return r('INVALID_URL')
    }
    const first = split[0]

    return r('OK', { data: first })
  } catch (error) {
    return r('INVALID_URL')
  }
}
