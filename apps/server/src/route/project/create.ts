import { zValidator } from '@hono/zod-validator'

import { db, dbSchema, eq } from '@coedit/db'
import { genID, isValidID } from '@coedit/id'
import { r, tryCatch } from '@coedit/r'
import { zCreateProject } from '@coedit/zschema'

import { files } from '#/utils/config'
import { hAuth } from '#/utils/h'
import { log } from '#/utils/log'

export const createProject = hAuth().post(
  '/',
  zValidator('json', zCreateProject),
  async (c) => {
    const userId = c.get('x-userId')
    const input = c.req.valid('json')

    if (!isValidID(input.templateId)) {
      return c.json(r('INVALID_TEMPLATE_ID'))
    }

    const [dbTemplate] = await db(c.env)
      .select()
      .from(dbSchema.templates)
      .where(eq(dbSchema.templates.id, input.templateId))

    if (!dbTemplate) {
      return c.json(r('INVALID_TEMPLATE_ID'))
    }

    const id = genID()

    const fs = files(c.env)

    const sourceKey = `templates/${input.templateId}.img.zst`
    const destinationKey = `projects/${userId}/${id}.img.zst`

    const existsResponse = await tryCatch(fs.exists(sourceKey))
    if (existsResponse.error || !existsResponse.data) {
      log.error(
        { error: existsResponse.error },
        'Template does not exist in S3'
      )
      return c.json(r('INVALID_TEMPLATE_ID'))
    }

    const copyResponse = await tryCatch(fs.copy(sourceKey, destinationKey))
    if (copyResponse.error) {
      log.error({ error: copyResponse.error }, 'Error copying template in S3')
      return c.json(r('ERROR'))
    }

    await db(c.env).insert(dbSchema.projects).values({
      id: id,
      userId: userId,
      name: input.name,
    })

    return c.json(
      r('OK', {
        projectId: id,
      })
    )
  }
)
