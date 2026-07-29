import type { Logger } from 'pino'

import { teardownProject } from '#/route/project/lifecycle'
import { listProjectStatuses, removeProjectStatus } from '#/utils/db'
import { log } from '#/utils/log'

// How often the cleanup sweep runs.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

// An INITIATING project that hasn't progressed within this window is treated as
// stuck/idle and cleaned up along with any partial state it left behind.
const INITIATING_STALE_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Periodically removes idle (stuck INITIATING) and ERROR projects: tears down
 * whatever partial state they left behind (container, mount, files, DNS) and
 * deletes their status row. RUNNING projects are left untouched.
 */
export function startCleanupCron() {
  const timer = setInterval(() => void runCleanup(), CLEANUP_INTERVAL_MS)
  // Don't keep the process alive just for the timer.
  timer.unref?.()
  return timer
}

export async function runCleanup() {
  const logger = log.child({ proc: 'cleanup' })
  const now = Date.now()

  const rows = listProjectStatuses()

  const stale = rows.filter((row) => {
    if (row.status === 'ERROR') return true
    if (
      row.status === 'INITIATING' &&
      now - row.updated_at > INITIATING_STALE_MS
    ) {
      return true
    }
    return false
  })

  if (stale.length === 0) return

  logger.info({ count: stale.length }, 'CLEANUP_BEGIN')

  for (const row of stale) {
    await cleanupProject(row.identifier, row.status, logger)
  }

  logger.info({ count: stale.length }, 'CLEANUP_DONE')
}

async function cleanupProject(
  identifier: string,
  status: string,
  logger: Logger
) {
  // identifier is `${userId}:${projectId}` — split on the last colon so a
  // userId containing a colon is still handled correctly.
  const sep = identifier.lastIndexOf(':')
  if (sep === -1) {
    logger.warn({ identifier }, 'CLEANUP_BAD_IDENTIFIER')
    removeProjectStatus(identifier)
    return
  }

  const userId = identifier.slice(0, sep)
  const projectId = identifier.slice(sep + 1)

  logger.info({ identifier, status }, 'CLEANUP_TEARDOWN')

  // teardownProject removes the status row (and any container/mount/files/DNS).
  await teardownProject(userId, projectId, logger)
}
