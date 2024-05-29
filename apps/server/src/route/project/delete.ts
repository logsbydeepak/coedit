import { zValidator } from '@hono/zod-validator'

import { and, db, dbSchema, eq } from '@coedit/db'
import { isValidID } from '@coedit/id'
import { r } from '@coedit/r'
import { z, zReqString } from '@coedit/zschema'

import { redis } from '#/utils/config'
import { hAuth } from '#/utils/h'
import { KVScheduleDeleteProject } from '#/utils/scheduled'

export const deleteProject = hAuth().delete(
  '/:id',
  zValidator(
    'param',
    z.object({
      id: zReqString,
    })
  ),
  async (c) => {
    const input = c.req.valid('param')
    const userId = c.get('x-userId')

    if (!isValidID(input.id)) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    const [res] = await db(c.env)
      .delete(dbSchema.projects)
      .where(
        and(
          eq(dbSchema.projects.id, input.id),
          eq(dbSchema.projects.userId, userId)
        )
      )
      .returning({
        id: dbSchema.projects.id,
      })

    if (!res) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    const redisClient = redis(c.env)
    await KVScheduleDeleteProject(redisClient).set(input.id)

    return c.json(r('OK'))
  }
)
