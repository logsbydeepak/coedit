import { Redis } from '@upstash/redis'
import ms from 'ms'

import { prefix } from '../prefix'

class _KVRunningProject {
  private key: string
  private client: Redis

  constructor(client: Redis, id: string) {
    this.key = prefix.runningProject.concat(id)
    this.client = client
  }

  async set(arn: string) {
    const res = await this.client.set(this.key, arn, {
      px: ms('1d'),
    })

    if (res !== 'OK') {
      throw new Error("can't set this.client this.key")
    }
  }

  async remove() {
    const res = await this.client.del(this.key)
    return !!res
  }

  async exists() {
    const res = await this.client.exists(this.key)
    return res === 1
  }

  async get() {
    const res = await this.client.get<string>(this.key)
    return res
  }
}

export function KVRunningProject(client: Redis, id: string) {
  return new _KVRunningProject(client, id)
}
