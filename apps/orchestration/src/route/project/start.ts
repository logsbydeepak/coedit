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

type ProjectPath = {
  s3Key: string
  userDir: string
  localCompressedFile: string
  localDecompressedFile: string
  mountDir: string
}

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

    const projectPath: ProjectPath = {
      s3Key: `projects/${input.projectId}.img.zst`,
      userDir: path.join(env.WORKDIR, 'projects', input.userId),
      localCompressedFile: path.join(
        env.WORKDIR,
        'projects',
        input.userId,
        input.projectId + '.img.zst'
      ),
      localDecompressedFile: path.join(
        env.WORKDIR,
        'projects',
        input.userId,
        input.projectId + '.img'
      ),
      mountDir: path.join(
        env.WORKDIR,
        'projects',
        input.userId,
        input.projectId
      ),
    }

    const ensureMountDir = await tryCatch(
      fs.mkdir(path.join(projectPath.mountDir), { recursive: true })
    )

    console.log(projectPath.mountDir)
    if (ensureMountDir.error) {
      log.error(
        { error: ensureMountDir.error },
        'FAILED_TO_CREATE_USER_PROJECTS_DIR'
      )
      return c.json(r('ERROR'))
    }

    const ensureS3File = await handleS3File(projectPath)
    if (ensureS3File.code !== 'OK') {
      log.error(
        { error: ensureS3File },
        'FAILED_TO_DOWNLOAD_PROJECT_FILE_FROM_S3'
      )
      return c.json(r('ERROR'))
    }

    const ensureDecompress = await handleCompressedFile(projectPath)
    if (ensureDecompress.code !== 'OK') {
      log.error(
        { error: ensureDecompress },
        'FAILED_TO_DECOMPRESS_PROJECT_FILE'
      )
      return c.json(r('ERROR'))
    }

    const ensureContainer = await handleContainer(projectPath)
    if (ensureContainer.code !== 'OK') {
      log.error({ error: ensureContainer }, 'FAILED_TO_START_CONTAINER')
      return c.json(r('ERROR'))
    }

    const ip = ensureContainer.ip

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

async function handleS3File(projectPath: ProjectPath) {
  const s3 = s3Client()

  const s3File = s3.file(projectPath.s3Key)
  const localFile = Bun.file(projectPath.localCompressedFile)

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
    return r('ERROR', {
      code: 'S3_DOWNLOAD_FAILED',
      error: result.error,
    })
  }

  return r('OK')
}

async function handleCompressedFile(projectPath: ProjectPath) {
  const proc = Bun.spawn({
    cmd: ['zstd', '-d', '-q', projectPath.localCompressedFile],
    cwd: projectPath.userDir,
  })

  const exitCode = await proc.exited

  if (exitCode !== 0) {
    return r('ERROR', {
      code: 'DECOMPRESS_FAILED',
    })
  }

  const removeCompressed = await tryCatch(
    fs.unlink(projectPath.localCompressedFile)
  )
  if (removeCompressed.error) {
    return r('ERROR', {
      code: 'REMOVE_COMPRESSED_FAILED',
      error: removeCompressed.error,
    })
  }

  const mountImg = await tryCatch(
    Bun.$`sudo mount -o loop ${projectPath.localDecompressedFile} ${projectPath.mountDir}`
  )

  if (mountImg.error) {
    return r('ERROR', {
      code: 'MOUNT_IMAGE_FAILED',
      error: mountImg.error,
    })
  }

  return r('OK')
}

async function handleContainer(projectPath: ProjectPath) {
  const networkName = 'bridge'

  const container = await tryCatch(
    docker.createContainer({
      Image: 'coedit',
      Cmd: ['/root/coedit/coedit-container-process'],
      Tty: false,
      Env: [`USER_API=${env.USER_API}`, `CORS_ORIGIN=${env.CORS_ORIGIN}`],
      HostConfig: {
        AutoRemove: true,
        Binds: [`${projectPath.mountDir}:/home/coedit/workspace`],
        NetworkMode: networkName,
      },
    })
  )

  if (container.error) {
    return r('CONTAINER_CREATE_FAILED', {
      error: container.error,
    })
  }

  if (!container.data) {
    return r('CONTAINER_CREATE_NO_DATA')
  }

  const res = await container.data.start()

  if (res.error) {
    return r('CONTAINER_START_FAILED', {
      error: res.error,
    })
  }

  if (!res.date) {
    return r('CONTAINER_START_NO_DATA')
  }

  const inspectData = await tryCatch(container.data.inspect())

  if (inspectData.error) {
    return r('CONTAINER_INSPECT_FAILED', {
      error: inspectData.error,
    })
  }

  const ip = inspectData.data.NetworkSettings.Networks[networkName].IPAddress

  return r('OK', {
    ip,
  })
}

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
