import fs from 'node:fs/promises'
import path from 'path'
import type Docker from 'dockerode'
import type { Logger } from 'pino'

import { KVdns } from '@coedit/kv'
import { r, tryCatch } from '@coedit/r'

import { env } from '#/env'
import { docker, redis } from '#/utils/config'
import { removeProjectStatus } from '#/utils/db'

export const NETWORK_NAME = 'bridge'

// Container labels used to locate a project's container and recover the DNS
// subdomain assigned at start time (so teardown can delete the record).
export const IDENTIFIER_LABEL = 'identifier'
export const SUBDOMAIN_LABEL = 'coedit.subdomain'

export type ProjectPath = {
  s3Key: string
  userDir: string
  localCompressedFile: string
  localDecompressedFile: string
  mountDir: string
  containerLabel: string
}

export function buildProjectPath(
  userId: string,
  projectId: string
): ProjectPath {
  const userDir = path.join(env.WORKDIR, 'projects', userId)
  return {
    s3Key: `projects/${projectId}.img.zst`,
    userDir,
    localCompressedFile: path.join(userDir, `${projectId}.img.zst`),
    localDecompressedFile: path.join(userDir, `${projectId}.img`),
    mountDir: path.join(userDir, projectId),
    containerLabel: `${userId}:${projectId}`,
  }
}

export async function pathExists(target: string) {
  const res = await tryCatch(fs.stat(target))
  return !res.error
}

export async function isMountpoint(target: string) {
  // Exit code 0 => it's a mountpoint. Non-zero (incl. path missing) => not.
  const res = await tryCatch(Bun.$`mountpoint -q ${target}`.nothrow().quiet())
  if (res.error || !res.data) return false
  return res.data.exitCode === 0
}

/**
 * Tears down every coedit project container on the host. Used on server
 * shutdown so no containers, loop mounts, or DNS records are left behind when
 * the orchestrator exits. Returns the number of projects torn down.
 */
export async function teardownAllProjects(logger: Logger) {
  const listed = await tryCatch(
    docker.listContainers({
      all: true,
      filters: { label: [IDENTIFIER_LABEL] },
    })
  )
  if (listed.error) {
    logger.error({ error: listed.error }, 'TEARDOWN_ALL_LIST_FAILED')
    return 0
  }

  let count = 0
  for (const info of listed.data) {
    const label = info.Labels?.[IDENTIFIER_LABEL]
    if (!label) continue

    // Label is `${userId}:${projectId}` — split on the last colon so a userId
    // containing a colon is still handled correctly.
    const sep = label.lastIndexOf(':')
    if (sep === -1) continue
    const userId = label.slice(0, sep)
    const projectId = label.slice(sep + 1)

    await teardownProject(userId, projectId, logger)
    count++
  }

  logger.info({ count }, 'TEARDOWN_ALL_DONE')
  return count
}

/** Finds the running/created container for a project by its identifier label. */
export async function findProjectContainer(containerLabel: string) {
  const res = await tryCatch(
    docker.listContainers({
      all: true,
      filters: { label: [`${IDENTIFIER_LABEL}=${containerLabel}`] },
    })
  )
  if (res.error) {
    return r('LIST_CONTAINERS_FAILED', { error: res.error })
  }
  return r('OK', { containers: res.data })
}

type TeardownResult = {
  containerRemoved: boolean
  dnsRemoved: boolean
  unmounted: boolean
  filesRemoved: boolean
  errors: string[]
}

/**
 * Tears down everything `start` created for a project: stops/removes the
 * container, deletes its DNS record, unmounts the loop image, and removes the
 * decompressed image + mount dir.
 *
 * Best-effort: every step runs even if an earlier one fails, and problems are
 * collected in `errors` rather than thrown — a partial teardown must still make
 * as much progress as possible so nothing leaks.
 */
export async function teardownProject(
  userId: string,
  projectId: string,
  logger: Logger
): Promise<TeardownResult> {
  const projectPath = buildProjectPath(userId, projectId)
  const result: TeardownResult = {
    containerRemoved: false,
    dnsRemoved: false,
    unmounted: false,
    filesRemoved: false,
    errors: [],
  }

  // Drop the managed status first so a concurrent /status poll doesn't report
  // it as RUNNING while we're tearing it down.
  removeProjectStatus(projectPath.containerLabel)

  const fail = (stage: string, error: unknown) => {
    logger.error({ error, stage }, 'TEARDOWN_STAGE_FAILED')
    result.errors.push(stage)
  }

  // 1. Container + DNS. Look it up so we can read the subdomain label back.
  const found = await findProjectContainer(projectPath.containerLabel)
  if (found.code !== 'OK') {
    fail('list_containers', found)
  } else {
    for (const info of found.containers) {
      const subdomain = info.Labels?.[SUBDOMAIN_LABEL]

      // Delete DNS first so no request is routed to a dying container.
      if (subdomain) {
        const dns = await tryCatch(KVdns(redis(), subdomain).remove())
        if (dns.error) fail('dns_remove', dns.error)
        else result.dnsRemoved = true
      }

      const container: Docker.Container = docker.getContainer(info.Id)
      // `force` stops if running; AutoRemove containers may already be gone,
      // which surfaces as a 404 we treat as success.
      const removed = await tryCatch(container.remove({ force: true }))
      if (removed.error && !isNotFound(removed.error)) {
        fail('container_remove', removed.error)
      } else {
        result.containerRemoved = true
      }
    }
  }

  // 2. Unmount the loop image (only if actually mounted).
  if (await isMountpoint(projectPath.mountDir)) {
    const umount = await tryCatch(
      Bun.$`sudo umount -d -l ${projectPath.mountDir}`.nothrow().quiet()
    )
    if (umount.error || (umount.data && umount.data.exitCode !== 0)) {
      fail('umount', umount.error ?? umount.data?.stderr.toString())
    } else {
      result.unmounted = true
    }
  } else {
    result.unmounted = true
  }

  // 3. Remove the decompressed image + mount dir (compressed file is already
  // deleted during start). Skip dir removal if it's somehow still mounted.
  const rmImage = await tryCatch(
    fs.rm(projectPath.localDecompressedFile, { force: true })
  )
  if (rmImage.error) fail('rm_image', rmImage.error)

  if (!(await isMountpoint(projectPath.mountDir))) {
    const rmDir = await tryCatch(
      fs.rm(projectPath.mountDir, { recursive: true, force: true })
    )
    if (rmDir.error) fail('rm_mount_dir', rmDir.error)
    else result.filesRemoved = true
  } else {
    fail('rm_mount_dir', 'still mounted')
  }

  return result
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    (error as { statusCode?: number }).statusCode === 404
  )
}
