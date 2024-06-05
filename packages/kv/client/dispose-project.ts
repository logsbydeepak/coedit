import { Redis } from '@upstash/redis'

import { prefix } from '../prefix'

class _KVDisposeProject {
  private readonly key = prefix.disposeProject
  private client: Redis

  constructor(client: Redis) {
    this.client = client
  }

  async set(id: string) {
    await this.client.sadd(this.key, id)
  }

  async get() {
    return await this.client.smembers(this.key)
  }

  async remove(id: string) {
    await this.client.srem(this.key, id)
  }

  async exists(id: string) {
    const res = await this.client.sismember(this.key, id)
    return res === 1
  }
}

export function KVDisposeProject(client: Redis) {
  return new _KVDisposeProject(client)
}
