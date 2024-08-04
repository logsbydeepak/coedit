import fs from 'node:fs/promises'
import path from 'path'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

import { r } from '@coedit/r'
import { zReqString } from '@coedit/zschema'

import { env } from '#/env'
import { h } from '#/utils/h'

export const deleteProject = h().delete(
  '/',
  zValidator(
    'json',
    z.object({
      userId: zReqString,
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
    const isValidProjectId = await fs.exists(projectDir)

    if (!isValidProjectId) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    await fs.rm(projectDir, { recursive: true, force: true })
    return c.json(r('OK'))
  }
)
