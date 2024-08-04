import fs from 'node:fs/promises'
import path from 'path'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

import { r } from '@coedit/r'
import { zReqString } from '@coedit/zschema'

import { env } from '#/env'
import { h } from '#/utils/h'

export const createProject = h().post(
  '/',
  zValidator(
    'json',
    z.object({
      userId: zReqString,
      templateId: zReqString,
      projectId: zReqString,
    })
  ),
  async (c) => {
    const input = c.req.valid('json')

    const projectDir = path.join(
      env.WORKDIR,
      'projects',
      input.userId,
      input.projectId
    )
    const templatesDir = path.join(env.WORKDIR, 'templates', input.templateId)
    const isTemplateValid = await fs.exists(templatesDir)

    if (!isTemplateValid) {
      return c.json(r('INVALID_TEMPLATE_ID'))
    }

    await fs.cp(templatesDir, projectDir, { recursive: true })
    return c.json(r('OK'))
  }
)
