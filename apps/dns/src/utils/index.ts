import { r } from '@coedit/r'

import { env } from '#/env'

export function getSubdomain(url: string) {
  try {
    if (!url.includes(env.ROOT_DOMAIN)) {
      throw new Error('root domain not found')
    }

    const split = url.split('.')
    if (split.length === 0) {
      throw new Error('the length of split is 0')
    }

    const first = split[0]

    return r('OK', { data: first })
  } catch (error) {
    return r('INVALID_URL')
  }
}
