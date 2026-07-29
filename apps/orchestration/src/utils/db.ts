import path from 'node:path'
import { Database } from 'bun:sqlite'

import { env } from '#/env'

/**
 * Lifecycle of a project on this instance:
 *
 *   INITIATING -> RUNNING     (start pipeline finished)
 *   INITIATING -> ERROR       (start pipeline failed)
 *
 * A project with no row is considered stopped / not present.
 */
export type ProjectStatus = 'INITIATING' | 'RUNNING' | 'ERROR'

export interface ProjectStatusRow {
  identifier: string
  status: ProjectStatus
  subdomain: string | null
  updated_at: number
}

// Persisted next to the workspace so status survives a process restart while
// containers are still up.
const db = new Database(path.join(env.WORKDIR, 'orchestration.sqlite'), {
  create: true,
})

db.exec('PRAGMA journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS project_status (
    identifier TEXT PRIMARY KEY,
    status     TEXT NOT NULL,
    subdomain  TEXT,
    updated_at INTEGER NOT NULL
  )
`)

const upsertStmt = db.query(`
  INSERT INTO project_status (identifier, status, subdomain, updated_at)
  VALUES ($identifier, $status, $subdomain, $updated_at)
  ON CONFLICT(identifier) DO UPDATE SET
    status     = excluded.status,
    subdomain  = excluded.subdomain,
    updated_at = excluded.updated_at
`)

const getStmt = db.query(
  'SELECT * FROM project_status WHERE identifier = $identifier'
)

const listStmt = db.query('SELECT * FROM project_status')

const deleteStmt = db.query(
  'DELETE FROM project_status WHERE identifier = $identifier'
)

export function setProjectStatus(
  identifier: string,
  status: ProjectStatus,
  subdomain: string | null = null
) {
  upsertStmt.run({
    $identifier: identifier,
    $status: status,
    $subdomain: subdomain,
    $updated_at: Date.now(),
  })
}

export function getProjectStatus(identifier: string) {
  return getStmt.get({ $identifier: identifier }) as ProjectStatusRow | null
}

export function listProjectStatuses() {
  return listStmt.all() as ProjectStatusRow[]
}

export function removeProjectStatus(identifier: string) {
  deleteStmt.run({ $identifier: identifier })
}
