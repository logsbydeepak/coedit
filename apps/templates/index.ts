import { readdir } from 'node:fs/promises'
import path from 'path'
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type PutObjectOutput,
} from '@aws-sdk/client-s3'
import { pino, type LoggerOptions } from 'pino'
import { ulid } from 'ulidx'

import { db, dbSchema } from '@coedit/server/src/db'

const pinoOptions: LoggerOptions = {}
if (process.stdout.isTTY) {
  pinoOptions.transport = {
    target: 'pino-pretty',
  }
}

const logger = pino(pinoOptions)

if (
  !process.env.AWS_REGION ||
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_BUCKET ||
  !process.env.DB_URL
) {
  logger.error('ENV missing. Exiting.')
  process.exit(1)
}

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})
const Bucket = process.env.AWS_BUCKET!

const dbClient = db({
  DB_URL: process.env.DB_URL!,
})

const PROJECT_DIR = 'templates'

async function main() {
  try {
    logger.info('Deleting all template from DB')
    await dbClient.delete(dbSchema.templates)

    logger.info('Deleting all remote template')
    await deleteFolder({ location: PROJECT_DIR })

    logger.info('Uploading templates')
    const values = await uploadFolder({ location: PROJECT_DIR })

    const insertAll = values.map(({ name, id }) =>
      dbClient.insert(dbSchema.templates).values({ id, name })
    )

    logger.info('Inserting templates to DB')
    await Promise.all(insertAll)

    process.exit(0)
  } catch (error) {
    logger.error(error, 'Something went wrong. Exiting.')
    process.exit(1)
  }
}

async function uploadFolder({ location }: { location: string }) {
  const entries: { name: string; id: string }[] = []

  const templates = await readdir(path.join(location), {
    withFileTypes: true,
  })

  const uploadArray: Promise<PutObjectOutput>[] = []
  for (const template of templates) {
    if (!template.isDirectory()) continue
    const templateId = ulid()

    logger.info(`Uploading template: ${template.name} AS ${templateId}`)
    const files = await readdir(path.join(location, template.name), {
      recursive: true,
      withFileTypes: true,
    })

    entries.push({
      name: template.name,
      id: templateId,
    })

    for (const file of files) {
      if (file.isDirectory()) continue

      const arrayBuffer = await Bun.file(
        path.join(location, template.name, file.name)
      ).arrayBuffer()

      const Body = Buffer.from(arrayBuffer)
      const Key = path.join(location, templateId, file.name)
      uploadArray.push(uploadLoadToS3({ Body, Key }))
    }
  }

  await Promise.all(uploadArray)
  return entries
}

async function deleteFolder({ location }: { location: string }) {
  const listCommand = new ListObjectsV2Command({
    Bucket,
    Prefix: location,
  })
  const list = await s3.send(listCommand)
  if (!list || !list.Contents || !list.Contents || !list.KeyCount) {
    logger.info('No files to delete.')
    return
  }

  const deleteCommand = new DeleteObjectsCommand({
    Bucket,
    Delete: {
      Objects: list.Contents.map((item) => ({ Key: item.Key })),
      Quiet: false,
    },
  })
  const deleted = await s3.send(deleteCommand)
  if (!deleted || !deleted.Deleted) {
    logger.info('No files deleted.')
    return
  }

  if (deleted.Errors) {
    deleted.Errors.map((error) =>
      logger.error(`${error.Key} could not be deleted - ${error.Code}`)
    )
  }
  logger.info(`${deleted.Deleted.length} files deleted.`)
  return
}

function uploadLoadToS3({ Key, Body }: { Key: string; Body: Buffer }) {
  return s3.send(
    new PutObjectCommand({
      Bucket,
      Key,
      Body,
    })
  )
}

main()
