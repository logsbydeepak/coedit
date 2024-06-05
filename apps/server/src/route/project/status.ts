import { zValidator } from '@hono/zod-validator'
import { generate } from 'random-words'

import { and, db, dbSchema, eq } from '@coedit/db'
import { isValidID } from '@coedit/id'
import { KVdns, KVRunningProject } from '@coedit/kv'
import { r } from '@coedit/r'
import { z, zReqString } from '@coedit/zschema'

import { ec2, ecs, redis } from '#/utils/config'
import { getPublicIPCommand } from '#/utils/ec2'
import { getTaskCommand } from '#/utils/ecs'
import { hAuth } from '#/utils/h'

export const projectStatus = hAuth().get(
  '/status/:id',
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

    if (c.env.CONTAINER_MODE === 'mock') {
      return c.json(
        r('OK', {
          api: 'http://localhost:4000',
          output: 'http://localhost:3000',
        })
      )
    }

    const projectArn = await KVRunningProject(redis(c.env), input.id).get()
    if (!projectArn) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    const ecsClient = ecs(c.env)
    const task = await getTaskCommand(ecsClient, { projectId: projectArn })

    if (task.code === 'NOT_FOUND') {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    if (task.data.lastStatus === 'RUNNING') {
      if (
        !task.data.attachments ||
        task.data.attachments.length === 0 ||
        !task.data.attachments[0].details
      ) {
        return c.json(r('INVALID_PROJECT_ID'))
      }

      const networkInterface = task.data.attachments.find(
        (attachment) => attachment.type === 'ElasticNetworkInterface'
      )

      if (!networkInterface || !networkInterface.details) {
        return c.json(r('INVALID_PROJECT_ID'))
      }

      const eniId = networkInterface?.details.find(
        (detail) => detail.name === 'networkInterfaceId'
      )?.value

      if (!eniId) {
        return c.json(r('INVALID_PROJECT_ID'))
      }
      const ec2Client = ec2(c.env)

      const publicIP = await getPublicIPCommand(ec2Client, { eniId })

      if (publicIP.code === 'NOT_FOUND') {
        return c.json(r('INVALID_PROJECT_ID'))
      }

      const dnsRedisClient = redis({
        APP_UPSTASH_REDIS_REST_URL: c.env.DNS_UPSTASH_REDIS_REST_URL,
        APP_UPSTASH_REDIS_REST_TOKEN: c.env.DNS_UPSTASH_REDIS_REST_TOKEN,
      })

      const IP = publicIP.data.IP
      const subdomain = await generateSubdomain(async (subdomain) => {
        return await KVdns(dnsRedisClient, subdomain).exists()
      })

      await KVdns(dnsRedisClient, subdomain).set(IP)

      return c.json(
        r('OK', {
          api: `https://${subdomain}-server${c.env.DNS_ROOT_DOMAIN}`,
          output: `https://${subdomain}-app${c.env.DNS_ROOT_DOMAIN}`,
        })
      )
    }

    if (!task.data.lastStatus) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    return c.json(r('STATUS', { status: task.data.lastStatus }))
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
