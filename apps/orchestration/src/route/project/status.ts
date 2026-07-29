import { zValidator } from '@hono/zod-validator'

import { r } from '@coedit/r'
import { z, zReqString } from '@coedit/zschema'

import { env } from '#/env'
import { getProjectStatus } from '#/utils/db'
import { h, validationHook } from '#/utils/h'

import { buildProjectPath } from './lifecycle'

/**
 * Reports the managed status of a project on this instance. The response code
 * is the status:
 *
 *   INITIATING   -> start pipeline still running, no urls yet
 *   RUNNING      -> container up, urls returned
 *   NOT_RUNNING  -> not present here or start failed
 */
export const statusProject = h().post(
  '/status',
  zValidator(
    'json',
    z.object({
      projectId: zReqString,
      userId: zReqString,
    }),
    validationHook
  ),
  async (c) => {
    const input = c.req.valid('json')
    const identifier = buildProjectPath(
      input.userId,
      input.projectId
    ).containerLabel

    const row = getProjectStatus(identifier)

    if (!row) {
      return c.json(r('NOT_RUNNING'))
    }

    if (row.status === 'INITIATING') {
      return c.json(r('INITIATING'))
    }

    if (row.status === 'RUNNING' && row.subdomain) {
      return c.json(
        r('RUNNING', {
          api: `http://${row.subdomain}-server${env.ROOT_DOMAIN}`,
          output: `http://${row.subdomain}-app${env.ROOT_DOMAIN}`,
        })
      )
    }

    return c.json(r('NOT_RUNNING'))
  }
)
