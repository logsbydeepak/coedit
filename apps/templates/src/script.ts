import path from 'path'
import { S3Client } from 'bun'
import { pino } from 'pino'

import { db as _db, dbSchema } from '@coedit/db'
import { genID } from '@coedit/id'
import { tryCatch } from '@coedit/r'
import { z } from '@coedit/zschema'

import templates from './templates/info.json'

const log = pino()

const schema = z.object({
  DB_URL: z.string().url(),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
})

async function main() {
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    log.error(
      { errors: parsed.error.format() },
      'invalid environment variables'
    )
    process.exit(1)
  }

  const env = parsed.data

  const TEMP_PATH = path.join('./temp')
  const TEMPLATES_PATH = path.join('./src/templates')
  const db = _db({ DB_URL: env.DB_URL })

  log.info('remove all templates from db')
  await db.delete(dbSchema.templates)

  log.info('delete temp directory')
  const removeTemp = await tryCatch(Bun.$`sudo rm -rf ${TEMP_PATH}`)
  if (removeTemp.error) {
    log.error({ error: removeTemp.error }, 'failed to remove temp directory')
    process.exit(1)
  }

  log.info(`create directory ${TEMP_PATH}`)
  const output = await tryCatch(Bun.$`mkdir -p ${TEMP_PATH}`)
  if (output.error) {
    log.error(
      { error: output.error },
      `failed to create directory ${TEMP_PATH}`
    )
    process.exit(1)
  }

  const save: { name: string; id: string }[] = []

  log.info('create .img')

  for (const each of templates) {
    const id = genID()

    const imgFile = await tryCatch(
      Bun.$`truncate -s 10G ${TEMP_PATH}/${id}.img`
    )
    if (imgFile.error) {
      log.error(
        { error: imgFile.error },
        `failed to create img file for ${each.name}`
      )
      process.exit(1)
    }

    const formatImg = await tryCatch(
      Bun.$`mkfs.ext4 -q -F ${TEMP_PATH}/${id}.img`
    )
    if (formatImg.error) {
      log.error(
        { error: formatImg.error },
        `failed to format img file for ${each.name}`
      )
      process.exit(1)
    }

    const mountDir = path.join(TEMP_PATH, id)
    const createMountDir = await tryCatch(Bun.$`mkdir -p ${mountDir}`)
    if (createMountDir.error) {
      log.error(
        { error: createMountDir.error },
        `failed to create mount directory for ${each.name}`
      )
      process.exit(1)
    }

    const mountImg = await tryCatch(
      Bun.$`sudo mount -o loop ${TEMP_PATH}/${id}.img ${mountDir}`
    )
    if (mountImg.error) {
      log.error(
        { error: mountImg.error },
        `failed to mount img file for ${each.name}`
      )
      process.exit(1)
    }

    const sourceDir = path.join(TEMPLATES_PATH, each.path)

    const copyFiles = await tryCatch(
      Bun.$`sudo cp -r ${sourceDir}/. ${mountDir}`
    )

    if (copyFiles.error) {
      log.error(
        { error: copyFiles.error },
        `failed to copy files for ${each.name}`
      )
      process.exit(1)
    }

    const unmountImg = await tryCatch(Bun.$`sudo umount ${mountDir}`)
    if (unmountImg.error) {
      log.error(
        { error: unmountImg.error },
        `failed to unmount img file for ${each.name}`
      )
      process.exit(1)
    }

    const compressImg = await tryCatch(
      Bun.$`zstd -q -T0 -3 ${TEMP_PATH}/${id}.img -o ${TEMP_PATH}/${id}.img.zst`
    )
    if (compressImg.error) {
      log.error(
        { error: compressImg.error },
        `failed to compress img file for ${each.name}`
      )
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

  const s3Client = new S3Client({
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    bucket: env.S3_BUCKET,
  })

  log.info('remove all templates from s3')

  const list = await tryCatch(
    s3Client.list({
      prefix: 'templates/',
    })
  )
  if (list.error) {
    log.error({ error: list.error }, `failed to list files in s3`)
    process.exit(1)
  }

  const contents = list.data.contents
  if (contents && contents.length !== 0) {
    for (const each of contents) {
      const del = await tryCatch(s3Client.delete(each.key))
      if (del.error) {
        log.error(
          { error: del.error },
          `failed to delete file ${each.key} in s3`
        )
        process.exit(1)
      }
      log.info(`Deleted from s3: ${each.key}`)
    }
  }

  log.info('upload to s3')

  for (const each of save) {
    const filePath = path.join(TEMP_PATH, `${each.id}.img.zst`)

    const s3File = s3Client.file(`templates/${each.id}.img.zst`)
    const localFile = Bun.file(filePath)

    const buffer = await tryCatch(localFile.arrayBuffer())
    if (buffer.error) {
      log.error(
        { error: buffer.error },
        `failed to read local file for ${each.name}`
      )
      process.exit(1)
    }

    const upload = await tryCatch(Bun.write(s3File, buffer.data))

    if (upload.error) {
      log.error(
        { error: upload.error },
        `failed to upload file to s3 for ${each.name}`
      )
      process.exit(1)
    }

    log.info(`Uploaded: ${each.name} -> ${each.id}`)
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
