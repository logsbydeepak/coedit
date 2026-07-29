import { zValidator } from '@hono/zod-validator'

import { and, db, dbSchema, eq } from '@coedit/db'
import { isValidID } from '@coedit/id'
import { KVnode } from '@coedit/kv'
import { r, tryCatch } from '@coedit/r'
import { z, zReqString } from '@coedit/zschema'

import { orchestration, redis } from '#/utils/config'
import { hAuth, validationHook } from '#/utils/h'
import { log } from '#/utils/log'

export const stopProject = hAuth().post(
  '/stop/:id',
  zValidator(
    'param',
    z.object({
      id: zReqString,
    }),
    validationHook
  ),
  async (c) => {
    const input = c.req.valid('param')
    const userId = c.get('x-userId')

    if (c.env.ORCHESTRATION_MODE === 'mock') {
      return c.json(r('OK'))
    }

    if (!isValidID(input.id)) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    const [dbProject] = await db(c.env)
      .select()
      .from(dbSchema.projects)
      .where(
        and(
          eq(dbSchema.projects.id, input.id),
          eq(dbSchema.projects.userId, userId)
        )
      )

    if (!dbProject) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    const node = KVnode(redis(c.env))

    const instanceId = await node.getProjectInstance(input.id)

    if (!instanceId) {
      return c.json(r('PROJECT_INSTANCE_NOT_FOUND'))
    }

    const instance = await node.get(instanceId)

    if (!instance) {
      return c.json(r('PROJECT_INSTANCE_NOT_FOUND'))
    }

    const { data: res, error } = await tryCatch(
      orchestration(instance).project.stop.$post({
        json: {
          userId,
          projectId: input.id,
        },
      })
    )

    const resData = res ? await res.json() : null

    if (error || !resData || resData.code !== 'OK') {
      log.error(
        { error, resData, projectId: input.id },
        'Error while stopping container'
      )
      return c.json(r('ERROR'))
    }

    // capacity is derived live from Docker, so there's no counter to decrement
    await node.removeProjectInstance(input.id)

    return c.json(r('OK'))
  }
)
