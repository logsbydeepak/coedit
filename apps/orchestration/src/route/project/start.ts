import fs from 'node:fs/promises'
import path from 'path'
import { zValidator } from '@hono/zod-validator'
import Docker from 'dockerode'
import { generate } from 'random-words'

import { r } from '@coedit/r'
import { z, zReqString } from '@coedit/zschema'

import { env } from '#/env'
import { redis } from '#/utils/config'
import { h } from '#/utils/h'

const NETWORK_NAME = 'coedit'

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

    const networks = await docker.listNetworks()

    const isNetworkExists = networks.some(
      (network) => network.Name === NETWORK_NAME
    )

    if (!isNetworkExists) {
      const res = await docker.createNetwork({
        Name: NETWORK_NAME,
        Driver: 'bridge',
      })
      if (!res) {
        return c.json(r('ERROR'))
      }

      const ip = await res.inspect()
    }

    const client = redis()

    const container = await docker.createContainer({
      Image: 'coedit',
      Cmd: ['/root/coedit/coedit-container-process'],
      Tty: false,
      HostConfig: {
        AutoRemove: true,
        Binds: [`${projectDir}:/root/coedit/workspace`],
        NetworkMode: 'none',
      },
    })

    if (!container) {
      return c.json(r('ERROR'))
    }

    // get container id
    const containerId = container.id

    const networkName = `coedit-${containerId}`
    const network = await docker.createNetwork({
      Name: networkName,
      Driver: 'bridge',
    })

    if (!network) {
      return c.json(r('ERROR'))
    }
    const res = await container.start()

    if (!res) {
      return c.json(r('ERROR'))
    }

    const inspectData = await container.inspect()
    const ip = inspectData.NetworkSettings.Networks[networkName].IPAddress

    const data = await docker.getNetwork(network.id).connect({
      Container: containerId,
    })
    if (!data) {
      return c.json(r('ERROR'))
    }

    const proxyNetwork = await docker.getNetwork(network.id).connect({
      Container: env.DOCKER_SOCKET_PATH,
    })
    if (!proxyNetwork) {
      return c.json(r('ERROR'))
    }

    const subdomain = await generateSubdomain(async () => {
      return true
    })

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
