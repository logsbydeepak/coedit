import { EC2Client } from '@aws-sdk/client-ec2'
import { ECSClient } from '@aws-sdk/client-ecs'
import { Redis } from '@upstash/redis/cloudflare'
import { Resend } from 'resend'

export const resend = ({ RESEND_API_KEY }: { RESEND_API_KEY: string }) => {
  return new Resend(RESEND_API_KEY)
}

export const redis = (env: {
  APP_UPSTASH_REDIS_REST_URL: string
  APP_UPSTASH_REDIS_REST_TOKEN: string
}) => {
  return Redis.fromEnv({
    UPSTASH_REDIS_REST_URL: env.APP_UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: env.APP_UPSTASH_REDIS_REST_TOKEN,
  })
}

export const ecs = (env: {
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  AWS_REGION: string
}) => {
  return new ECSClient({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  })
}

export const ec2 = (env: {
  AWS_ACCESS_KEY_ID: string
  AWS_SECRET_ACCESS_KEY: string
  AWS_REGION: string
}) => {
  return new EC2Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  })
}
