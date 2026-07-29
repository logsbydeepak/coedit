import { Redis } from '@upstash/redis'

import { prefix } from '../prefix'

export interface Instance {
  id: string
  url: string
  secret: string
}

type InstanceHash = Record<string, unknown> & {
  url: string
  secret: string
}

/**
 * Registry of orchestration instances. Only connection details live here —
 * capacity (max + current) is served live by each instance's `/capacity`
 * endpoint, so it can never drift from the actual running containers.
 *
 * Redis structure
 *
 *   SET  node                 -> { instance:1, instance:2, ... }
 *   HASH instance:<id>        -> url, secret
 *   STR  PROJECT_INSTANCE-<projectId> -> <id>   (which instance a project runs on)
 */
class _KVnode {
  private client: Redis

  constructor(client: Redis) {
    this.client = client
  }

  private instanceKey(id: string) {
    return prefix.instance.concat(':', id)
  }

  private projectKey(projectId: string) {
    return prefix.projectInstance.concat('-', projectId)
  }

  /**
   * Register an instance.
   *
   *   HSET instance:<id> url ... secret ...
   *   SADD node instance:<id>
   */
  async add(instance: { id: string; url: string; secret: string }) {
    const key = this.instanceKey(instance.id)
    await this.client.hset(key, {
      url: instance.url,
      secret: instance.secret,
    })
    await this.client.sadd(prefix.node, instance.id)
  }

  /**
   * Remove an instance from the pool.
   */
  async remove(id: string) {
    await this.client.srem(prefix.node, id)
    await this.client.del(this.instanceKey(id))
  }

  /**
   * SMEMBERS node
   */
  async list() {
    return await this.client.smembers(prefix.node)
  }

  /**
   * HGETALL instance:<id>
   */
  async get(id: string) {
    const data = await this.client.hgetall<InstanceHash>(this.instanceKey(id))
    if (!data) {
      return null
    }
    return {
      id,
      url: data.url,
      secret: data.secret,
    } satisfies Instance
  }

  async setProjectInstance(projectId: string, instanceId: string) {
    await this.client.set(this.projectKey(projectId), instanceId)
  }

  async getProjectInstance(projectId: string) {
    return await this.client.get<string>(this.projectKey(projectId))
  }

  async removeProjectInstance(projectId: string) {
    await this.client.del(this.projectKey(projectId))
  }
}

export function KVnode(client: Redis) {
  return new _KVnode(client)
}
