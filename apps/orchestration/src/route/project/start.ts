import fs from 'node:fs/promises'
import path from 'path'
import { zValidator } from '@hono/zod-validator'
import Docker from 'dockerode'
import { generate } from 'random-words'

import { KVdns } from '@coedit/kv'
import { r, tryCatch } from '@coedit/r'
import { z, zReqString } from '@coedit/zschema'

import { env } from '#/env'
import { redis, s3Client } from '#/utils/config'
import { h } from '#/utils/h'
import { log } from '#/utils/log'

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

    const projectFileCompletePath = path.join(
      env.WORKDIR,
      'projects',
      input.userId,
      input.projectId + '.img.zst'
    )
    const projectMountDir = path.join('projects', input.userId, input.projectId)

    const createDirResult = await tryCatch(
      fs.mkdir(path.join(env.WORKDIR, projectMountDir), {
        recursive: true,
      })
    )

    if (createDirResult.error) {
      log.error(
        { error: createDirResult.error },
        'FAILED_TO_CREATE_PROJECT_DIR'
      )
      return c.json(r('ERROR'))
    }

    const s3 = s3Client()
    const key = `projects/${input.projectId}.img.zst`

    const s3File = s3.file(key)
    const localFile = Bun.file(projectFileCompletePath)
    const localWriter = localFile.writer()

    const s3Stream = s3File.stream()

    const handleChunk = new WritableStream({
      write: async function (chunk) {
        await localWriter.write(chunk)
      },
      close: async function () {
        await localWriter.end()
      },
      abort: function (err) {},
    })

    const result = await tryCatch(s3Stream.pipeTo(handleChunk))

    if (result.error) {
      log.error({ error: result.error }, 'FAILED_TO_DOWNLOAD_PROJECT_IMAGE')
      return c.json(r('ERROR'))
    }

    const proc = Bun.spawn({
      cmd: ['zstd', '-d', '-q', projectFileCompletePath],
      cwd: path.join(env.WORKDIR, 'projects', input.userId),
    })

    const exitCode = await proc.exited

    if (exitCode !== 0) {
      log.error({ exitCode }, 'FAILED_TO_DECOMPRESS_PROJECT_IMAGE')
      return c.json(r('ERROR'))
    }

    const removeCompressed = await tryCatch(fs.unlink(projectFileCompletePath))
    if (removeCompressed.error) {
      log.error(
        { error: removeCompressed.error },
        'FAILED_TO_REMOVE_COMPRESSED_PROJECT_IMAGE'
      )
      return c.json(r('ERROR'))
    }

    const decompressedImgPath = path.join(
      env.WORKDIR,
      'projects',
      input.userId,
      input.projectId + '.img'
    )

    const mountImg = await tryCatch(
      Bun.$`sudo mount -o loop ${decompressedImgPath} ${projectMountDir}`
    )

    if (mountImg.error) {
      log.error({ error: mountImg.error }, 'FAILED_TO_MOUNT_PROJECT_IMAGE')
      return c.json(r('ERROR'))
    }

    const networkName = 'bridge'

    const container = await tryCatch(
      docker.createContainer({
        Image: 'coedit',
        Cmd: ['/root/coedit/coedit-container-process'],
        Tty: false,
        Env: [`USER_API=${env.USER_API}`, `CORS_ORIGIN=${env.CORS_ORIGIN}`],
        HostConfig: {
          AutoRemove: true,
          Binds: [`${projectMountDir}:/home/coedit/workspace`],
          NetworkMode: networkName,
        },
      })
    )

    if (container.error) {
      log.error({ error: container.error }, 'FAILED_TO_CREATE_CONTAINER')
      return c.json(r('ERROR'))
    }

    if (!container.data) {
      return c.json(r('ERROR'))
    }

    const res = await container.data.start()

    if (res.error) {
      log.error({ error: res.error }, 'FAILED_TO_START_CONTAINER')
      return c.json(r('ERROR'))
    }

    if (!res.date) {
      return c.json(r('ERROR'))
    }

    const inspectData = await tryCatch(container.data.inspect())

    if (inspectData.error) {
      log.error({ error: inspectData.error }, 'FAILED_TO_INSPECT_CONTAINER')
      return c.json(r('ERROR'))
    }

    const ip = inspectData.data.NetworkSettings.Networks[networkName].IPAddress

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
