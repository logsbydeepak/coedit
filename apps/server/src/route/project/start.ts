import { zValidator } from '@hono/zod-validator'
import { generate } from 'random-words'

import { and, db, dbSchema, eq } from '@coedit/db'
import { isValidID } from '@coedit/id'
import { r } from '@coedit/r'
import { z, zReqString } from '@coedit/zschema'

import { orchestration } from '#/utils/config'
import { hAuth } from '#/utils/h'

export const startProject = hAuth().post(
  '/start/:id',
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

    const res = await orchestration(c.env).project.start.$post({
      json: {
        userId,
        projectId: input.id,
      },
    })
    const resData = await res.json()

    if (resData.code === 'INVALID_PROJECT_ID') {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    if (resData.code === 'ERROR') {
      throw new Error('Error while starting container')
    }

    const subdomain = generateSubdomain(async (subdomain) => {
      return true
    })

    return c.json(
      r('OK', {
        api: `http://${subdomain}-server${c.env.DNS_ROOT_DOMAIN}`,
        output: `http://${subdomain}-app${c.env.DNS_ROOT_DOMAIN}`,
      })
    )
  }
)

async function generateSubdomain(
  isExist: (subdomain: string) => Promise<boolean>
) {
  while (true) {
    const subdomain = generate({
      exactly: 1,
      wordsPerString: 2,
      separator: '-',
    })[0].toLowerCase()

    if (subdomain.includes('-app') || subdomain.includes('-server')) {
      continue
    }

    const isExistSubdomain = await isExist(subdomain)

    if (!isExistSubdomain) {
      return subdomain
    }
  }
}
