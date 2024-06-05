import { Redis } from '@upstash/redis'

import { prefix } from '../prefix'

class _KVDeleteProject {
  private readonly key = prefix.deleteProject
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
    return await this.client.srem(this.key, id)
  }

  async exists(id: string) {
    return await this.client.sismember(this.key, id)
  }
}

export function KVDeleteProject(client: Redis) {
  return new _KVDeleteProject(client)
}
