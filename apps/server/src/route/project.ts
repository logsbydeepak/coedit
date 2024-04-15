import {
  CopyObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3'
import { zValidator } from '@hono/zod-validator'
import { isValid, ulid } from 'ulidx'
import { z } from 'zod'

import { zReqString } from '@coedit/zschema'

import { db, dbSchema } from '#/db'
import { s3 } from '#/lib/config'
import { h, hAuth, r } from '#/utils/h'

const create = hAuth().post(
  '/',
  zValidator('json', z.object({ baseProjectId: zReqString })),
  async (c) => {
    const userId = c.get('x-userId')
    const input = c.req.valid('json')

    if (!isValid(input.baseProjectId)) {
      return c.json(r('INVALID_PROJECT_ID'))
    }

    const newProjectId = ulid()

    await copyFolder({
      s3: s3(c.env),
      fromBucket: c.env.AWS_BUCKET,
      toBucket: c.env.AWS_BUCKET,
      fromLocation: `base-project/${input.baseProjectId}`,
      toLocation: `projects/${userId}/${newProjectId}`,
    })

    return c.json(r('OK'))
  }
)

async function copyFolder({
  fromBucket,
  fromLocation,
  toBucket = fromBucket,
  toLocation,
  s3,
}: {
  fromBucket: string
  fromLocation: string
  toBucket: string
  toLocation: string
  s3: S3Client
}) {
  let count = 0

  const recursiveCopy = async function (token?: string) {
    const listCommand = new ListObjectsV2Command({
      Bucket: fromBucket,
      Prefix: fromLocation,
      ContinuationToken: token,
    })

    const list = await s3.send(listCommand)
    if (list.KeyCount && list.Contents) {
      const fromObjectKeys = list.Contents.map((content) => content.Key)
      for (let fromObjectKey of fromObjectKeys) {
        if (!fromObjectKey) continue

        const toObjectKey = fromObjectKey.replace(fromLocation, toLocation)

        const copyCommand = new CopyObjectCommand({
          Bucket: toBucket,
          CopySource: `${fromBucket}/${fromObjectKey}`,
          Key: toObjectKey,
        })
        await s3.send(copyCommand)
        count += 1
      }
    }
    if (list.NextContinuationToken) {
      recursiveCopy(list.NextContinuationToken)
    }
    return `${count} files copied.`
  }
  return recursiveCopy()
}

// const get = hAuth().get('/:id', async (c) => { })
// const getAll = hAuth().get('/', async (c) => { })
// const update = hAuth().put('/:id', async (c) => { })
// const remove = hAuth().delete('/:id', async (c) => { })

const baseProjects = hAuth().get('/', async (c) => {
  const projects = await db(c.env).select().from(dbSchema.baseProjects)
  return c.json(
    r('OK', {
      projects,
    })
  )
})

export const projectRoute = h().route('/base', baseProjects).route('/', create)
// .route('/', get)
// .route('/', getAll)
// .route('/', update)
// .route('/', remove)
