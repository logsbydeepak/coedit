import { zValidator } from '@hono/zod-validator'

import { and, db, dbSchema, eq } from '@coedit/db'
import { isValidID } from '@coedit/id'
import { r, tryCatch } from '@coedit/r'
import { z, zReqString } from '@coedit/zschema'

import { files } from '#/utils/config'
import { hAuth, validationHook } from '#/utils/h'
import { log } from '#/utils/log'

export const deleteProject = hAuth().delete(
  '/:id',
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

    const fs = files(c.env)
    const objectKey = `projects/${userId}/${input.id}.img.zst`

    const deleteResponse = await tryCatch(fs.delete(objectKey))
    if (deleteResponse.error) {
      log.error({ error: deleteResponse.error }, 'Error deleting project in S3')
      return c.json(r('ERROR'))
    }

    return c.json(r('OK'))
  }
)
