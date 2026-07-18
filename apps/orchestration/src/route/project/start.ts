import fs from 'node:fs/promises'
import { zValidator } from '@hono/zod-validator'
import type Docker from 'dockerode'
import { FilesError } from 'files-sdk'
import type { Logger } from 'pino'
import { generate } from 'random-words'

import { KVdns } from '@coedit/kv'
import { r, tryCatch } from '@coedit/r'
import { z, zReqString } from '@coedit/zschema'

import { env } from '#/env'
import { docker, files, redis } from '#/utils/config'
import { h, validationHook } from '#/utils/h'
import { log } from '#/utils/log'

import {
  buildProjectPath,
  IDENTIFIER_LABEL,
  isMountpoint,
  NETWORK_NAME,
  pathExists,
  SUBDOMAIN_LABEL,
  type ProjectPath,
} from './lifecycle'

const MAX_SUBDOMAIN_ATTEMPTS = 50

/** A best-effort undo action registered by a completed step. */
type Rollback = () => Promise<unknown>

export const startProject = h().post(
  '/start',
  zValidator(
    'json',
    z.object({
      projectId: zReqString,
      userId: zReqString,
    }),
    validationHook
  ),
  async (c) => {
    const input = c.req.valid('json')
    const projectPath = buildProjectPath(input.userId, input.projectId)

    // Request-scoped logger: every line carries userId/projectId so a single
    // project start can be traced end-to-end.
    const logger = log.child({
      req: 'project.start',
      userId: input.userId,
      projectId: input.projectId,
    })

    // Every successful step pushes its inverse here. On any failure we unwind
    // in reverse so we never leak dirs, files, loop mounts, or containers.
    const rollbacks: Rollback[] = []

    const startedAt = performance.now()
    logger.info('PROJECT_START_BEGIN')

    const result = await startPipeline(projectPath, rollbacks, logger)
    const durationMs = Math.round(performance.now() - startedAt)

    if (result.code !== 'OK') {
      logger.error({ result, durationMs }, 'PROJECT_START_FAILED')
      await runRollbacks(rollbacks, logger)
      return c.json(r('ERROR'), statusFor(result.code))
    }

    logger.info({ subdomain: result.subdomain, durationMs }, 'PROJECT_START_OK')

    return c.json(
      r('OK', {
        api: `http://${result.subdomain}-server${env.ROOT_DOMAIN}`,
        output: `http://${result.subdomain}-app${env.ROOT_DOMAIN}`,
      })
    )
  }
)

async function startPipeline(
  projectPath: ProjectPath,
  rollbacks: Rollback[],
  logger: Logger
) {
  const mountDir = await step(logger, 'ensureMountDir', () =>
    ensureMountDir(projectPath, rollbacks)
  )
  if (mountDir.code !== 'OK') return mountDir

  const download = await step(logger, 'downloadImage', () =>
    downloadImage(projectPath, rollbacks, logger)
  )
  if (download.code !== 'OK') return download

  const decompress = await step(logger, 'decompressImage', () =>
    decompressImage(projectPath, rollbacks)
  )
  if (decompress.code !== 'OK') return decompress

  const mount = await step(logger, 'mountImage', () =>
    mountImage(projectPath, rollbacks)
  )
  if (mount.code !== 'OK') return mount

  // Reserve the subdomain before the container so it can be stamped onto the
  // container as a label — teardown reads it back to delete the DNS record.
  const reserve = await step(logger, 'reserveSubdomain', () =>
    reserveSubdomain()
  )
  if (reserve.code !== 'OK') return reserve

  const container = await step(logger, 'startContainer', () =>
    startContainer(projectPath, reserve.subdomain, rollbacks, logger)
  )
  if (container.code !== 'OK') return container

  const dns = await step(logger, 'setDns', () =>
    setDns(reserve.subdomain, container.ip, rollbacks, logger)
  )
  if (dns.code !== 'OK') return dns

  return r('OK', { subdomain: reserve.subdomain })
}

/** Runs a pipeline step, logging its start, duration, and outcome. */
async function step<T extends { code: string }>(
  logger: Logger,
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startedAt = performance.now()
  logger.debug({ step: name }, 'STEP_BEGIN')

  const result = await fn()
  const durationMs = Math.round(performance.now() - startedAt)

  if (result.code === 'OK') {
    logger.info({ step: name, durationMs }, 'STEP_OK')
  } else {
    logger.warn({ step: name, durationMs, code: result.code }, 'STEP_FAILED')
  }

  return result
}

/** Maps a step failure code to an HTTP status. */
function statusFor(code: string): 404 | 409 | 500 {
  if (code === 'S3_FILE_NOT_FOUND') return 404
  if (code === 'ALREADY_RUNNING') return 409
  return 500
}

async function runRollbacks(rollbacks: Rollback[], logger: Logger) {
  if (rollbacks.length === 0) return

  logger.warn({ count: rollbacks.length }, 'ROLLBACK_BEGIN')

  // Reverse order, best-effort: a failing undo must not abort the rest.
  const ordered = rollbacks.slice().reverse()
  for (let i = 0; i < ordered.length; i++) {
    const res = await tryCatch(ordered[i]())
    if (res.error) {
      logger.error({ error: res.error, index: i }, 'ROLLBACK_STEP_FAILED')
    }
  }

  logger.warn('ROLLBACK_DONE')
}

async function ensureMountDir(projectPath: ProjectPath, rollbacks: Rollback[]) {
  // Reject if the target is already an active mountpoint — stale state from a
  // previous crashed run would otherwise make `mount` fail with EBUSY later.
  const alreadyMounted = await isMountpoint(projectPath.mountDir)
  if (alreadyMounted) {
    return r('ALREADY_RUNNING', { mountDir: projectPath.mountDir })
  }

  // `mkdir -p` is idempotent, so remember whether the dir already existed:
  // rollback must not delete a directory we didn't create.
  const preExisting = await pathExists(projectPath.mountDir)

  const res = await tryCatch(
    fs.mkdir(projectPath.mountDir, { recursive: true })
  )
  if (res.error) {
    return r('MOUNT_DIR_FAILED', { error: res.error })
  }

  if (!preExisting) {
    rollbacks.push(() =>
      fs.rm(projectPath.mountDir, { recursive: true, force: true })
    )
  }
  return r('OK')
}

const S3_DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000 // large images: allow 5 min/attempt

async function downloadImage(
  projectPath: ProjectPath,
  rollbacks: Rollback[],
  logger: Logger
) {
  const store = files()

  const result = await tryCatch(
    (async () => {
      // `as: "stream"` keeps the body lazy so a multi-GB image is never fully
      // buffered in memory — bytes flow S3 -> disk. Retry transient provider
      // failures; a per-attempt timeout guards against a hung backend.
      const file = await store.download(projectPath.s3Key, {
        as: 'stream',
        timeout: S3_DOWNLOAD_TIMEOUT_MS,
        retries: { max: 3, backoff: ({ attempt }) => attempt * 500 },
      })

      // Register cleanup before writing, so a partially-written file is removed
      // on any failure below.
      rollbacks.push(() =>
        fs.rm(projectPath.localCompressedFile, { force: true })
      )

      const bytesWritten = await Bun.write(
        projectPath.localCompressedFile,
        new Response(file.stream())
      )

      // Integrity check: the object's advertised size must match what we wrote.
      // Guards against truncated transfers that still "succeed".
      if (typeof file.size === 'number' && bytesWritten !== file.size) {
        throw new Error(
          `size mismatch: expected ${file.size} bytes, wrote ${bytesWritten}`
        )
      }

      return bytesWritten
    })()
  )

  if (result.error) {
    // Surface a missing object distinctly from a transport failure so the
    // caller can map it to 404 instead of 500.
    if (
      result.error instanceof FilesError &&
      result.error.code === 'NotFound'
    ) {
      return r('S3_FILE_NOT_FOUND', { s3Key: projectPath.s3Key })
    }
    return r('S3_DOWNLOAD_FAILED', { error: result.error })
  }

  logger.info(
    { s3Key: projectPath.s3Key, bytes: result.data },
    'IMAGE_DOWNLOADED'
  )
  return r('OK')
}

async function decompressImage(
  projectPath: ProjectPath,
  rollbacks: Rollback[]
) {
  // Fail fast with a clear code if the binary is missing from PATH rather than
  // surfacing an opaque spawn error.
  if (!Bun.which('zstd')) {
    return r('ZSTD_NOT_FOUND')
  }

  const proc = Bun.spawn({
    cmd: ['zstd', '-d', '-q', projectPath.localCompressedFile],
    cwd: projectPath.userDir,
    stdin: 'ignore',
    stdout: 'ignore',
    stderr: 'pipe', // must pipe to actually read stderr on failure
  })

  const stderr = await new Response(proc.stderr).text()
  const exitCode = await proc.exited
  if (exitCode !== 0) {
    return r('DECOMPRESS_FAILED', { exitCode, stderr })
  }

  // A zero exit is necessary but confirm the output was actually produced
  // before anything tries to mount it.
  if (!(await pathExists(projectPath.localDecompressedFile))) {
    return r('DECOMPRESS_NO_OUTPUT', {
      path: projectPath.localDecompressedFile,
    })
  }

  rollbacks.push(() =>
    fs.rm(projectPath.localDecompressedFile, { force: true })
  )

  // The compressed source is no longer needed once decompression succeeded.
  const removeCompressed = await tryCatch(
    fs.rm(projectPath.localCompressedFile, { force: true })
  )
  if (removeCompressed.error) {
    return r('REMOVE_COMPRESSED_FAILED', { error: removeCompressed.error })
  }

  return r('OK')
}

async function mountImage(projectPath: ProjectPath, rollbacks: Rollback[]) {
  // NOTE: requires a passwordless sudoers entry scoped to `mount`/`umount`.
  // `.nothrow().quiet()` so a non-zero exit is inspected here, not thrown,
  // and mount's output doesn't leak to the parent stdio.
  const mount = await tryCatch(
    Bun.$`sudo mount -o loop ${projectPath.localDecompressedFile} ${projectPath.mountDir}`
      .nothrow()
      .quiet()
  )
  if (mount.error) {
    return r('MOUNT_IMAGE_FAILED', { error: mount.error })
  }
  if (mount.data.exitCode !== 0) {
    return r('MOUNT_IMAGE_FAILED', {
      exitCode: mount.data.exitCode,
      stderr: mount.data.stderr.toString(),
    })
  }

  // Confirm the kernel actually registered the mountpoint.
  if (!(await isMountpoint(projectPath.mountDir))) {
    return r('MOUNT_NOT_ACTIVE', { mountDir: projectPath.mountDir })
  }

  rollbacks.push(async () => {
    // `-d` detaches the auto-allocated loop device; `-l` (lazy) so a briefly
    // busy target still unwinds instead of blocking rollback forever.
    await Bun.$`sudo umount -d -l ${projectPath.mountDir}`.nothrow().quiet()
  })
  return r('OK')
}

async function startContainer(
  projectPath: ProjectPath,
  subdomain: string,
  rollbacks: Rollback[],
  logger: Logger
) {
  const created = await tryCatch(
    docker.createContainer({
      Image: 'coedit',
      Cmd: ['/root/coedit/coedit-container-process'],
      Tty: false,
      Env: [`USER_API=${env.USER_API}`, `CORS_ORIGIN=${env.CORS_ORIGIN}`],
      Labels: {
        [IDENTIFIER_LABEL]: projectPath.containerLabel,
        [SUBDOMAIN_LABEL]: subdomain,
      },
      HostConfig: {
        AutoRemove: true,
        Binds: [`${projectPath.mountDir}:/home/coedit/workspace`],
        NetworkMode: NETWORK_NAME,
      },
    })
  )

  if (created.error) {
    return r('CONTAINER_CREATE_FAILED', { error: created.error })
  }
  if (!created.data) {
    return r('CONTAINER_CREATE_NO_DATA')
  }

  const container: Docker.Container = created.data
  logger.debug({ containerId: container.id }, 'CONTAINER_CREATED')
  // Registered before start so a failed start still gets cleaned up.
  rollbacks.push(() => container.remove({ force: true }))

  const started = await tryCatch(container.start())
  if (started.error) {
    return r('CONTAINER_START_FAILED', {
      error: started.error,
      containerId: container.id,
    })
  }

  const inspected = await tryCatch(container.inspect())
  if (inspected.error) {
    return r('CONTAINER_INSPECT_FAILED', {
      error: inspected.error,
      containerId: container.id,
    })
  }

  const ip = inspected.data.NetworkSettings.Networks?.[NETWORK_NAME]?.IPAddress
  if (!ip) {
    return r('CONTAINER_NO_IP', { containerId: container.id })
  }

  logger.info({ containerId: container.id, ip }, 'CONTAINER_RUNNING')
  return r('OK', { ip })
}

async function reserveSubdomain() {
  const redisClient = redis()

  const subdomain = await generateSubdomain((candidate) =>
    KVdns(redisClient, candidate).exists()
  )
  if (!subdomain) {
    return r('SUBDOMAIN_EXHAUSTED')
  }

  return r('OK', { subdomain })
}

async function setDns(
  subdomain: string,
  ip: string,
  rollbacks: Rollback[],
  logger: Logger
) {
  const set = await tryCatch(KVdns(redis(), subdomain).set(ip, env.MACHINE_IP))
  if (set.error || !set.data) {
    return r('DNS_SET_FAILED', { error: set.error, subdomain })
  }

  rollbacks.push(() => KVdns(redis(), subdomain).remove())
  logger.info({ subdomain, ip }, 'DNS_REGISTERED')
  return r('OK')
}

async function generateSubdomain(
  isTaken: (subdomain: string) => Promise<boolean>
) {
  for (let attempt = 0; attempt < MAX_SUBDOMAIN_ATTEMPTS; attempt++) {
    const subdomain = generate({
      exactly: 1,
      wordsPerString: 2,
      separator: '-',
    })[0].toLowerCase()

    if (subdomain.includes('-app') || subdomain.includes('-server')) {
      continue
    }

    if (!(await isTaken(subdomain))) {
      return subdomain
    }
  }

  return null
}
