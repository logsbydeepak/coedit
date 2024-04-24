import {
  CopyObjectCommand,
  CopyObjectOutput,
  ListObjectsV2Command,
  type S3Client,
} from '@aws-sdk/client-s3'

import { r } from '@coedit/r'

export async function copyFolder({
  Bucket: Bucket,
  from: from,
  to: to,
  s3,
}: {
  Bucket: string
  from: string
  to: string
  s3: S3Client
}) {
  try {
    const recursiveCopy = async function (token?: string) {
      const listCommand = new ListObjectsV2Command({
        Bucket: Bucket,
        Prefix: from,
        ContinuationToken: token,
      })
      const list = await s3.send(listCommand)

      const copyPromises: Promise<CopyObjectOutput>[] = []
      if (list.KeyCount && list.Contents) {
        const fromObjectKeys = list.Contents.map((content) => content.Key)

        for (let fromObjectKey of fromObjectKeys) {
          if (!fromObjectKey) continue

          const toObjectKey = fromObjectKey.replace(from, to)

          const copyCommand = new CopyObjectCommand({
            Bucket: Bucket,
            CopySource: `${Bucket}/${fromObjectKey}`,
            Key: toObjectKey,
          })
          copyPromises.push(s3.send(copyCommand))
          await s3.send(copyCommand)
        }
      }

      await Promise.all(copyPromises)
      if (list.NextContinuationToken) {
        recursiveCopy(list.NextContinuationToken)
      }
      return r('OK')
    }
    return recursiveCopy()
  } catch (error) {
    return r('ERROR')
  }
}
