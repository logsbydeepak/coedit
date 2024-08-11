import { Redis } from '@upstash/redis'
import ms from 'ms'

import { prefix } from '../prefix'

class _KVOrchestration {
  private key: string
  private client: Redis
  private domainPrefix: string
  private ipPrefix: string

  constructor(client: Redis) {
    this.key = prefix.orchestration
    this.client = client
    this.domainPrefix = prefix.dns.concat('-', 'DOMAIN')
    this.ipPrefix = prefix.dns.concat('-', 'IP')
  }

  async setDomainIP(ip: string, domain: string) {
    const txn = this.client.multi()
    txn.set(this.domainPrefix.concat('-', domain), ip, {
      px: ms('7 days'),
    })

    txn.sadd(this.domainPrefix, domain)
    txn.sadd(this.ipPrefix, ip)
    const res = await txn.exec()

    for (const r of res) {
      if (r !== 1) {
        return false
      }
    }

    return true
  }
  async isIPExist(ip: string) {
    const res = await this.client.exists(this.ipPrefix.concat('-', ip))
    return res === 1
  }

  async isDomainExist(domain: string) {
    const res = await this.client.exists(this.domainPrefix.concat('-', domain))
    return res === 1
  }
}

export function KVOrchestration(client: Redis) {
  return new _KVOrchestration(client)
}
