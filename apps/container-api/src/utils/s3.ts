import {
  GetObjectCommand,
  ListObjectsV2Command,
  type S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { r } from '@coedit/r'

export async function getFiles(
  s3: S3Client,
  {
    Bucket,
    key: key,
  }: {
    Bucket: string
    key: string
  }
) {
  try {
    const files: {
      path: string
      url: string
    }[] = []

    const recursive = async function (token?: string) {
      const listCommand = new ListObjectsV2Command({
        Bucket: Bucket,
        Prefix: key,
        ContinuationToken: token,
      })
      const list = await s3.send(listCommand)

      const promises: Promise<string>[] = []
      if (list.KeyCount && list.Contents) {
        const fromObjectKeys = list.Contents.map((content) => content.Key)

        for (const fromObjectKey of fromObjectKeys) {
          if (!fromObjectKey) continue

          const command = new GetObjectCommand({
            Bucket: Bucket,
            Key: fromObjectKey,
          })

          const signedUrl = getSignedUrl(s3, command).then((url) => {
            files.push({
              path: fromObjectKey.replace(key, ''),
              url: url,
            })

            return url
          })

          promises.push(signedUrl)
        }
      }

      await Promise.all(promises)
      if (list.NextContinuationToken) {
        recursive(list.NextContinuationToken)
      }

      return r('OK', { files })
    }
    return recursive()
  } catch (error) {
    return r('ERROR')
  }
}
