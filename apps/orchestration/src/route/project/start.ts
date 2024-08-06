import fs from 'node:fs/promises'
import path from 'path'
import { zValidator } from '@hono/zod-validator'
import Docker from 'dockerode'

import { r } from '@coedit/r'
import { z, zReqString } from '@coedit/zschema'

import { env } from '#/env'
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
        IPAM: {
          Driver: 'default',
          Config: [
            {
              Subnet: '172.18.0.0/16',
            },
          ],
        },
      })
      if (!res) {
        return c.json(r('ERROR'))
      }
    }

    const ip = generateIP()

    const container = await docker.createContainer({
      Image: 'coedit',
      Cmd: ['/root/coedit/coedit-container-process'],
      Tty: false,
      HostConfig: {
        AutoRemove: true,
        Binds: [`${projectDir}:/root/coedit/workspace`],
        NetworkMode: NETWORK_NAME,
      },
      NetworkingConfig: {
        EndpointsConfig: {
          [NETWORK_NAME]: {
            IPAMConfig: {
              IPv4Address: ip,
            },
          },
        },
      },
    })

    if (!container) {
      return c.json(r('ERROR'))
    }

    const res = await container.start()
    if (!res) {
      return c.json(r('ERROR'))
    }

    return c.json(r('OK'))
  }
)

function generateIP() {
  const subnet = '172.18.0.'
  const ip = Math.floor(Math.random() * 254) + 1
  return `${subnet}${ip}`
}
