import { Redis } from '@upstash/redis'

type ProjectStatus = 'STARTING' | 'INITIALIZING' | 'RUNNING'
export function KVProject(redis: Redis, id: string) {
  const key = `project:${id}`

  async function set(status: ProjectStatus, url: string) {
    const res = await redis.hmset(key, {
      status,
      url,
    })

    if (res !== 'OK') {
      throw new Error("can't set redis key")
    }
  }

  async function update(status: ProjectStatus) {
    await redis.hset(key, {
      status,
    })
  }

  async function remove() {
    const res = await redis.del(key)
    return !!res
  }

  async function get() {
    const res = await redis.hgetall<{
      status: ProjectStatus
      url: string
    }>(key)
    return res
  }

  return Object.freeze({
    get,
    remove,
    update,
    set,
  })
}
