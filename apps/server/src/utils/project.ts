import { Redis } from '@upstash/redis'
import ms from 'ms'

export function KVProject(redis: Redis, id: string) {
  const key = `project:${id}`

  async function set(arn: string) {
    const res = await redis.set(key, arn, {
      px: ms('1d'),
    })

    if (res !== 'OK') {
      throw new Error("can't set redis key")
    }
  }

  async function remove() {
    const res = await redis.del(key)
    return !!res
  }

  async function exists() {
    const res = await redis.exists(key)
    return res === 1
  }

  async function get() {
    const res = await redis.get<string>(key)
    return res
  }

  return Object.freeze({
    get,
    remove,
    set,
    exists,
  })
}
