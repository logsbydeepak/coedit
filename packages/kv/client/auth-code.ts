import { Redis } from '@upstash/redis'
import ms from 'ms'

import { prefix } from '../prefix'

class _KVAuthCode {
  private key: string
  private client: Redis

  constructor(client: Redis, type: 'LOGIN' | 'REGISTER', email: string) {
    this.client = client
    this.key = prefix.authCode.concat('-', type, ':', email)
  }

  async exists() {
    const res = await this.client.exists(this.key)
    return !!res
  }

  async set(code: number) {
    const res = await this.client.set(this.key, code, {
      px: ms('15 minutes'),
    })
    if (res !== 'OK') {
      throw new Error("can't set this.client this.key")
    }
  }

  async get() {
    const res = await this.client.get<number>(this.key)
    return res
  }

  async remove() {
    const res = await this.client.del(this.key)
    return !!res
  }
}

export function KVAuthCode(
  client: Redis,
  type: 'LOGIN' | 'REGISTER',
  email: string
) {
  return new _KVAuthCode(client, type, email)
}
