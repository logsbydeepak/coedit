import { zValidator } from '@hono/zod-validator'

import { r } from '@coedit/r'
import { z, zReqString } from '@coedit/zschema'

import { h, validationHook } from '#/utils/h'
import { log } from '#/utils/log'

import { teardownProject } from './lifecycle'

export const stopProject = h().post(
  '/stop',
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

    const logger = log.child({
      req: 'project.stop',
      userId: input.userId,
      projectId: input.projectId,
    })

    const startedAt = performance.now()
    logger.info('PROJECT_STOP_BEGIN')

    const result = await teardownProject(input.userId, input.projectId, logger)
    const durationMs = Math.round(performance.now() - startedAt)

    if (result.errors.length > 0) {
      logger.error({ result, durationMs }, 'PROJECT_STOP_PARTIAL')
      return c.json(r('ERROR', { stages: result.errors }))
    }

    logger.info({ result, durationMs }, 'PROJECT_STOP_OK')
    return c.json(r('OK'))
  }
)
