import { readdir } from 'node:fs/promises'
import path from 'path'
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type PutObjectOutput,
} from '@aws-sdk/client-s3'
import { ulid } from 'ulidx'

import { db, dbSchema } from '@coedit/server/src/db'

if (
  !process.env.AWS_REGION ||
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_BUCKET ||
  !process.env.DB_URL
) {
  console.log('ENV missing')
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

const LOCAL_PROJECT_DIR = 'projects'
const REMOTE_PROJECT_DIR = 'base-project'

async function main() {
  try {
    console.log('-> DELETE DB ENTRY')
    await dbClient.delete(dbSchema.baseProjects)

    console.log('-> DELETE ALL REMOTE PROJECTS')
    await deleteFolder({ location: REMOTE_PROJECT_DIR })

    console.log('-> UPLOAD PROJECTS')
    const values = await uploadFolder({ location: LOCAL_PROJECT_DIR })

    const insertAll = values.map(({ name, id }) =>
      dbClient.insert(dbSchema.baseProjects).values({ id, name })
    )

    console.log('-> INSERT PROJECT TO DB')
    await Promise.all(insertAll)

    process.exit(0)
  } catch (error) {
    console.log('ERROR')
    console.log(error)
    process.exit(1)
  }
}

async function uploadFolder({ location }: { location: string }) {
  const entries: { name: string; id: string }[] = []

  const projects = await readdir(path.join(location), {
    withFileTypes: true,
  })

  const uploadArray: Promise<PutObjectOutput>[] = []
  for (const project of projects) {
    if (!project.isDirectory()) continue
    const projectId = ulid()

    const files = await readdir(path.join(location, project.name), {
      recursive: true,
      withFileTypes: true,
    })

    entries.push({
      name: project.name,
      id: projectId,
    })

    for (const file of files) {
      if (file.isDirectory()) continue

      const arrayBuffer = await Bun.file(
        path.join(location, project.name, file.name)
      ).arrayBuffer()

      const Body = Buffer.from(arrayBuffer)
      const Key = path.join(REMOTE_PROJECT_DIR, projectId, file.name)
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
  if (!list || !list.Contents || !list.Contents || !list.KeyCount)
    return 'No files to delete.'

  const deleteCommand = new DeleteObjectsCommand({
    Bucket,
    Delete: {
      Objects: list.Contents.map((item) => ({ Key: item.Key })),
      Quiet: false,
    },
  })
  const deleted = await s3.send(deleteCommand)
  if (!deleted || !deleted.Deleted) return 'No files deleted.'

  if (deleted.Errors) {
    deleted.Errors.map((error) =>
      console.log(`${error.Key} could not be deleted - ${error.Code}`)
    )
  }
  return `${deleted.Deleted.length} files deleted.`
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
