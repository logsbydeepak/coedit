import fs from 'node:fs/promises'
import path from 'path'
import { zValidator } from '@hono/zod-validator'
import Docker from 'dockerode'
import ms from 'ms'
import { generate } from 'random-words'

import { r } from '@coedit/r'
import { z, zReqString } from '@coedit/zschema'

import { env } from '#/env'
import { redis } from '#/utils/config'
import { h } from '#/utils/h'

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

    const docker = new Docker({
      socketPath: env.DOCKER_SOCKET_PATH,
    })

    const redisClient = redis()

    const container = await docker.createContainer({
      Image: 'coedit',
      Cmd: ['/root/coedit/coedit-container-process'],
      Tty: false,
      HostConfig: {
        AutoRemove: true,
        Binds: [`${projectDir}:/root/coedit/workspace`],
      },
    })

    if (!container) {
      return c.json(r('ERROR'))
    }

    const containerId = container.id

    const networkName = `coedit-${containerId}`
    const network = await docker.createNetwork({
      Name: networkName,
    })

    if (!network) {
      return c.json(r('ERROR'))
    }
    const res = await container.start()

    if (!res) {
      return c.json(r('ERROR'))
    }

    const inspectData = await container.inspect()
    const ip = inspectData.NetworkSettings.Networks.bridge.IPAddress

    const data = await docker.getNetwork(network.id).connect({
      Container: containerId,
    })
    if (!data) {
      return c.json(r('ERROR'))
    }

    const proxyNetwork = await docker.getNetwork(network.id).connect({
      Container: env.PROXY_CONTAINER_ID,
    })
    if (!proxyNetwork) {
      return c.json(r('ERROR'))
    }

    const subdomain = await generateSubdomain(async (data) => {
      const res = await redisClient.exists(`SUBDOMAIN-${data}`)
      if (!res) {
        return false
      }
      return true
    })

    await redisClient.set(
      `CONTAINER_IP-${subdomain}`,
      `${ip}:${env.PUBLIC_IP}`,
      {
        ex: ms('30 minutes'),
      }
    )

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
