import { EC2Client } from '@aws-sdk/client-ec2'
import { ECSClient } from '@aws-sdk/client-ecs'
import { Redis } from '@upstash/redis/cloudflare'
import { Resend } from 'resend'

import { ENV } from './h'

export const resend = (env: Pick<ENV, 'RESEND_API_KEY'>) => {
  return new Resend(env.RESEND_API_KEY)
}

export const redis = (
  env: Pick<ENV, 'APP_UPSTASH_REDIS_REST_URL' | 'APP_UPSTASH_REDIS_REST_TOKEN'>
) => {
  return Redis.fromEnv({
    UPSTASH_REDIS_REST_URL: env.APP_UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: env.APP_UPSTASH_REDIS_REST_TOKEN,
  })
}

export const ecs = (
  env: Pick<ENV, 'AWS_ACCESS_KEY_ID' | 'AWS_SECRET_ACCESS_KEY' | 'AWS_REGION'>
) => {
  return new ECSClient({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  })
}

export const ec2 = (
  env: Pick<ENV, 'AWS_ACCESS_KEY_ID' | 'AWS_SECRET_ACCESS_KEY' | 'AWS_REGION'>
) => {
  return new EC2Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  })
}
