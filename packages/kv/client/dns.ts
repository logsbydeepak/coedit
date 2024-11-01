import { Redis } from '@upstash/redis'
import ms from 'ms'

import { prefix } from '../prefix'

class _KVdns {
  private key: string
  private client: Redis

  constructor(client: Redis, subdomain: string) {
    this.key = prefix.dns.concat('-', subdomain)
    this.client = client
  }

  async set(containerIP: string, machineIP: string) {
    const res = await this.client.set(this.key, `${containerIP}:${machineIP}`, {
      px: ms('7 days'),
    })
    if (res !== 'OK') {
      return false
    }
    return true
  }

  async exists() {
    const res = await this.client.exists(this.key)
    return res === 1
  }

  async getMachineIP() {
    const res = await this.client.get<string>(this.key)
    if (!res) {
      return null
    }
    return res.split(':')[1]
  }
}

export function KVdns(client: Redis, subdomain: string) {
  return new _KVdns(client, subdomain)
}
