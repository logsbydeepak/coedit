import path from 'path'
import { pino } from 'pino'

import { db as _db, dbSchema } from '@coedit/db'
import { genID } from '@coedit/id'

import templates from './templates/info.json'

const log = pino()

const WORKDIR = process.env.WORKDIR
const DB_URL = process.env.DB_URL
const BASE_PATH = process.env.BASE_PATH

async function main() {
  if (!WORKDIR) {
    log.error('WORKDIR is not set')
    process.exit(1)
  }

  if (!DB_URL) {
    log.error('DB_URL is not set')
    process.exit(1)
  }

  if (!BASE_PATH) {
    log.error('BASE_PATH is not set')
    process.exit(1)
  }

  const OUTPUT_PATH = path.join(WORKDIR, 'templates', '/')
  const db = _db({ DB_URL })

  log.info('remove all templates from db')
  await db.delete(dbSchema.templates)

  log.info(`create directory ${OUTPUT_PATH}`)
  const output = await Bun.$`mkdir -p ${OUTPUT_PATH}`.nothrow()
  if (output.exitCode !== 0) {
    log.error({
      code: output.exitCode,
      stderr: output.stderr.toString(),
    })
    process.exit(1)
  }

  const save: { name: string; id: string }[] = []

  log.info('copy templates')
  for (const each of templates) {
    const id = genID()
    const sourceDir = path.join(BASE_PATH, each.path)
    const destDir = path.join(path.join(OUTPUT_PATH, id))

    log.info(
      {
        id: id,
        src: sourceDir,
        dest: destDir,
      },
      `copy ${each.name}`
    )
    const output = await Bun.$`cp -r ${sourceDir} ${destDir}`.nothrow()
    if (output.exitCode !== 0) {
      log.error({
        code: output.exitCode,
        stderr: output.stderr.toString(),
      })
      process.exit(1)
    }
    save.push({ name: each.name, id })
  }

  for (const each of save) {
    await db.insert(dbSchema.templates).values({
      id: each.id,
      name: each.name,
    })
    log.info(`Saved: ${each.name} -> ${each.id}`)
  }
}

main()
  .then(() => {
    log.info('done')
    process.exit(0)
  })
  .catch((error) => {
    log.error(error)
    process.exit(1)
  })
