import fs from 'node:fs/promises'
import path from 'path'
import { zValidator } from '@hono/zod-validator'
import Docker from 'dockerode'
import { generate } from 'random-words'

import { genID } from '@coedit/id'
import { KVdns } from '@coedit/kv'
import { r } from '@coedit/r'
import { z, zReqString } from '@coedit/zschema'

import { env } from '#/env'
import { redis } from '#/utils/config'
import { h } from '#/utils/h'

const docker = new Docker({
  socketPath: env.DOCKER_SOCKET_PATH,
})

export const startProject = h().post(
  '/start',
  zValidator(
    'json',
    z.object({
      projectId: zReqString,
      userId: zReqString,
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

    const networkName = `coedit-${genID()}`
    const network = await docker.createNetwork({
      Name: networkName,
    })

    if (!network) {
      return c.json(r('ERROR'))
    }

    const container = await docker.createContainer({
      Image: 'coedit',
      Cmd: ['/root/coedit/coedit-container-process'],
      Tty: false,
      Env: [`USER_API=${env.USER_API}`, `CORS_ORIGIN=${env.CORS_ORIGIN}`],
      HostConfig: {
        AutoRemove: true,
        Binds: [`${projectDir}:/home/coedit/workspace`],
        NetworkMode: networkName,
      },
    })

    if (!container) {
      return c.json(r('ERROR'))
    }

    const res = await container.start()

    if (!res) {
      return c.json(r('ERROR'))
    }

    const inspectData = await container.inspect()
    const ip = inspectData.NetworkSettings.Networks[networkName].IPAddress

    const proxyNetwork = await docker.getNetwork(network.id).connect({
      Container: env.PROXY_CONTAINER_ID,
    })
    if (!proxyNetwork) {
      return c.json(r('ERROR'))
    }

    const redisClient = redis()
    const subdomain = await generateSubdomain(async (data) => {
      const res = await KVdns(redisClient, data).exists()
      if (!res) {
        return false
      }
      return true
    })

    const redisSetRes = await KVdns(redisClient, subdomain).set(
      ip,
      env.PUBLIC_IP
    )

    if (!redisSetRes) {
      return c.json(r('ERROR'))
    }

    return c.json(
      r('OK', {
        api: `http://${subdomain}-server${env.ROOT_DOMAIN}`,
        output: `http://${subdomain}-app${env.ROOT_DOMAIN}`,
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
