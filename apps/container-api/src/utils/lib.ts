import { S3Client } from '@aws-sdk/client-s3'
import { Redis } from '@upstash/redis/cloudflare'

export const redis = (env: {
  UPSTASH_REDIS_REST_URL: string
  UPSTASH_REDIS_REST_TOKEN: string
}) => {
  return Redis.fromEnv(env)
}

export const s3 = (env: {
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  AWS_REGION: string
}) => {
  return new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  })
}
