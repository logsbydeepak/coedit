import { zValidator } from '@hono/zod-validator'

import { and, db, dbSchema, eq } from '@coedit/db'
import { isValidID } from '@coedit/id'
import { r } from '@coedit/r'
import { z, zReqString } from '@coedit/zschema'

import { orchestration } from '#/utils/config'
import { hAuth } from '#/utils/h'

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

    const orchestrationRes = await orchestration(c.env).project.$delete({
      json: {
        userId: userId,
        projectId: input.id,
      },
    })
    const orchestrationResData = await orchestrationRes.json()

    if (orchestrationResData.code === 'INVALID_PROJECT_ID') {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    return c.json(r('OK'))
  }
)
