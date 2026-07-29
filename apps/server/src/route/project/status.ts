import { zValidator } from '@hono/zod-validator'

import { and, db, dbSchema, eq } from '@coedit/db'
import { isValidID } from '@coedit/id'
import { KVnode } from '@coedit/kv'
import { r, tryCatch } from '@coedit/r'
import { z, zReqString } from '@coedit/zschema'

import { orchestration, redis } from '#/utils/config'
import { hAuth, validationHook } from '#/utils/h'
import { log } from '#/utils/log'

export const statusProject = hAuth().post(
  '/status/:id',
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
      return c.json(
        r('RUNNING', {
          api: 'http://localhost:4000',
          output: 'http://localhost:3000',
        })
      )
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
      return c.json(r('NOT_RUNNING'))
    }

    const instance = await node.get(instanceId)

    if (!instance) {
      return c.json(r('NOT_RUNNING'))
    }

    const { data: res, error } = await tryCatch(
      orchestration(instance).project.status.$post({
        json: {
          userId,
          projectId: input.id,
        },
      })
    )

    const resData = res ? await res.json() : null

    if (error || !resData) {
      log.error(
        { error, projectId: input.id },
        'Error while fetching project status'
      )
      return c.json(r('ERROR'))
    }

    if (resData.code === 'RUNNING') {
      return c.json(
        r('RUNNING', {
          api: resData.api,
          output: resData.output,
        })
      )
    }

    if (resData.code === 'INITIATING') {
      return c.json(r('INITIATING'))
    }

    return c.json(r('NOT_RUNNING'))
  }
)
