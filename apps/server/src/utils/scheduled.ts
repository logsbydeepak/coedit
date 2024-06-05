import { KVDeleteProject, KVDisposeProject } from '@coedit/kv'

import { ec2, redis } from './config'
import { deleteProjectResource, freeProjectResource } from './ec2'
import { ENV } from './h'

export async function scheduled(env: ENV) {
  const redisClient = redis(env)
  const KVDisposeProjectClient = KVDisposeProject(redisClient)
  const KVDeleteProjectClient = KVDeleteProject(redisClient)

  const projectResource = await KVDisposeProjectClient.get()

  for (const projectId of projectResource) {
    const ec2Client = ec2(env)
    const res = await freeProjectResource(ec2Client, {
      projectTagId: projectId,
    })
    if (res.code === 'NO_RESOURCE') {
      await KVDisposeProjectClient.remove(projectId)
    }
  }

  const deleteProject = await KVDeleteProjectClient.get()

  for (const projectId of deleteProject) {
    const ec2Client = ec2(env)

    const res = await deleteProjectResource(ec2Client, {
      projectTagId: projectId,
    })

    if (res.code === 'NO_RESOURCE') {
      await KVDeleteProjectClient.remove(projectId)
    }
  }
}
