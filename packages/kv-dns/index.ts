import { Redis } from '@upstash/redis'

export function KVdns(client: Redis, subdomain: string) {
  const key = `dns-${subdomain}`

  async function set(ip: string) {
    const res = await client.set(key, ip)
    if (res !== 'OK') {
      return false
    }
    return true
  }

  async function remove() {
    const res = await client.del(key)
    return !!res
  }

  async function exists() {
    const res = await client.exists(key)
    return res === 1
  }

  async function get() {
    const res = await client.get<string>(key)
    return res
  }

  return Object.freeze({
    get,
    remove,
    set,
    exists,
  })
}
