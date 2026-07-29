import { r, tryCatch } from '@coedit/r'

import { env } from '#/env'
import { docker } from '#/utils/config'
import { h } from '#/utils/h'
import { log } from '#/utils/log'

import { IDENTIFIER_LABEL } from './project/lifecycle'

export const capacityRoute = h().get('/', async (c) => {
  const listed = await tryCatch(
    docker.listContainers({
      filters: { label: [IDENTIFIER_LABEL] },
    })
  )

  if (listed.error) {
    log.error({ error: listed.error }, 'CAPACITY_LIST_FAILED')
    return c.json(r('ERROR'))
  }

  return c.json(
    r('OK', {
      max_capacity: env.MAX_CAPACITY,
      current_cnt: listed.data.length,
    })
  )
})
