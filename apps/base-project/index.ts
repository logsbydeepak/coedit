import { readdir } from 'node:fs/promises'
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type PutObjectOutput,
} from '@aws-sdk/client-s3'

async function main() {
  if (
    !process.env.AWS_REGION ||
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY ||
    !process.env.AWS_BUCKET
  ) {
    console.log('ENV missing')
  }

  const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
  const Bucket = process.env.AWS_BUCKET!

  console.log('Deleting...')
  await deleteFolder({ location: 'projects/', s3, Bucket })

  const projects = await readdir(`${import.meta.dir}/projects`, {
    withFileTypes: true,
  })

  const uploadArray: Promise<PutObjectOutput>[] = []
  projects.forEach(async (project) => {
    if (!project.isDirectory()) return
    const files = await readdir(`${import.meta.dir}/projects/${project.name}`, {
      withFileTypes: true,
      recursive: true,
    })

    files.forEach(async (file) => {
      if (file.isDirectory()) return
      const Key = `projects/${project.name}/${file.name}`

      const read = await Bun.file(
        `${import.meta.dir}/projects/${project.name}/${file.name}`
      ).text()
      uploadArray.push(
        uploadLoadToS3({
          Key,
          Body: read,
          s3,
          Bucket,
        })
      )
    })
  })

  console.log('Uploading...')
  await Promise.all(uploadArray).catch(console.error)
}

async function deleteFolder({
  location,
  s3,
  Bucket,
}: {
  location: string
  s3: S3Client
  Bucket: string
}) {
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

function uploadLoadToS3({
  Key,
  Body,
  s3,
  Bucket,
}: {
  Key: string
  Body: string
  s3: S3Client
  Bucket: string
}) {
  return s3.send(
    new PutObjectCommand({
      Bucket,
      Key,
      Body,
    })
  )
}

main()
