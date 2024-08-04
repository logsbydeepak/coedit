import fs from 'fs'
import path from 'path'
import { pino } from 'pino'
import unzipper from 'unzipper'

import { db as _db, dbSchema } from '@coedit/db'
import { genID } from '@coedit/id'

import templates from './template.json'

const log = pino()

const WORKDIR = process.env.WORKDIR
const DB_URL = process.env.DB_URL

const BASE_PATH = 'src'

async function main() {
  try {
    if (!WORKDIR) {
      log.error('WORKDIR is not set')
      process.exit(1)
    }

    if (!DB_URL) {
      log.error('DB_URL is not set')
      process.exit(1)
    }

    const OUTPUT_PATH = path.join(WORKDIR, 'templates', '/')

    fs.rmdirSync(OUTPUT_PATH, { recursive: true })
    const db = _db({ DB_URL })

    log.info('remove all templates from db')
    await db.delete(dbSchema.templates)

    const save: { name: string; id: string }[] = []

    const promises = templates.map((each) => {
      const inputPath = path.join(BASE_PATH, each.path)
      const id = genID()

      return new Promise<void>((resolve, reject) => {
        fs.createReadStream(inputPath)
          .pipe(unzipper.Parse())
          .on('entry', function(entry) {
            const fileName = entry.path
            const type = entry.type

            const outputPath = path.join(
              path.join(OUTPUT_PATH),
              id,
              fileName.replace(/^[^/\\]+/, '')
            )

            if (type === 'File') {
              const dir = path.dirname(outputPath)
              fs.mkdirSync(dir, { recursive: true })
              entry.pipe(fs.createWriteStream(outputPath))
            } else {
              fs.mkdirSync(outputPath, { recursive: true })
              entry.autodrain()
            }
          })
          .on('finish', () => {
            save.push({ name: each.name, id })
            log.info(`Extraction complete: ${each.name} -> ${id}`)
            resolve()
          })
          .on('error', (err) => {
            log.error(err, `An error occurred: ${each.name} -> ${id}`)
            reject(err)
          })
      })
    })

    await Promise.all(promises)

    for (const each of save) {
      await db.insert(dbSchema.templates).values({
        id: each.id,
        name: each.name,
      })
      log.info(`Saved: ${each.name} -> ${each.id}`)
    }
  } catch (error) {
    log.error(error)
  }
}

main().then(() => {
  log.info('done')
  process.exit(0)
})
