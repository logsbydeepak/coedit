import { zValidator } from '@hono/zod-validator'

import { db, dbSchema, eq } from '@coedit/db'
import { genID, isValidID } from '@coedit/id'
import { r } from '@coedit/r'
import { zCreateProject } from '@coedit/zschema'

import { orchestration } from '#/utils/config'
import { hAuth } from '#/utils/h'

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
    const res = await orchestration(c.env).project.$post({
      json: {
        userId: userId,
        projectId: id,
        templateId: input.templateId,
      },
    })
    const resData = await res.json()

    if (resData.code === 'INVALID_TEMPLATE_ID') {
      return c.json('INVALID_TEMPLATE_ID')
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
