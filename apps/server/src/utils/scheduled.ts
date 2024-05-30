import { Redis } from '@upstash/redis'

import { ec2, redis } from './config'
import { deleteProjectResource, freeProjectResource } from './ec2'
import { ENV } from './h'

export function KVScheduleFreeProjectResource(client: Redis) {
  const key = 'free-project-resource'
  async function set(projectId: string) {
    await client.sadd(key, projectId)
  }

  async function get() {
    return await client.smembers(key)
  }

  async function remove(projectId: string) {
    await client.srem(key, projectId)
  }

  async function exists(projectId: string) {
    const res = await client.sismember(key, projectId)
    return res === 1
  }

  return Object.freeze({ set, get, remove, exists })
}

export function KVScheduleDeleteProject(client: Redis) {
  const key = `delete-project`

  async function set(projectId: string) {
    await client.sadd(key, projectId)
  }

  async function get() {
    return await client.smembers(key)
  }

  async function remove(projectId: string) {
    return await client.srem(key, projectId)
  }

  async function exists(projectId: string) {
    return await client.sismember(key, projectId)
  }

  return Object.freeze({ set, get, remove, exists })
}

export async function scheduled(env: ENV) {
  const redisClient = redis(env)
  const KVScheduleFreeProjectResourceClient =
    KVScheduleFreeProjectResource(redisClient)
  const KVScheduleDeleteProjectClient = KVScheduleDeleteProject(redisClient)

  const projectResource = await KVScheduleFreeProjectResourceClient.get()

  for (const projectId of projectResource) {
    const ec2Client = ec2(env)
    const res = await freeProjectResource(ec2Client, {
      projectTagId: projectId,
    })
    if (res.code === 'NO_RESOURCE') {
      await KVScheduleFreeProjectResourceClient.remove(projectId)
    }
  }

  const deleteProject = await KVScheduleDeleteProjectClient.get()

  for (const projectId of deleteProject) {
    const ec2Client = ec2(env)

    const res = await deleteProjectResource(ec2Client, {
      projectTagId: projectId,
    })

    if (res.code === 'NO_RESOURCE') {
      await KVScheduleDeleteProjectClient.remove(projectId)
    }
  }
}
