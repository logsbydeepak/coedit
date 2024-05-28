import {
  DescribeTasksCommand,
  ECSClient,
  RunTaskCommand,
} from '@aws-sdk/client-ecs'

import { r } from '@coedit/r'

import { ENV } from './h'

const ECS_CLUSTER = 'coedit-builder'
const ECS_LAUNCH_TYPE = 'FARGATE'
const ECS_TASK_DEFINITION = 'coedit'

export async function getTaskCommand(
  client: ECSClient,
  input: { projectId: string }
) {
  const command = new DescribeTasksCommand({
    cluster: ECS_CLUSTER,
    tasks: [input.projectId],
  })

  const res = await client.send(command)

  if (!res.tasks || res.tasks.length === 0) {
    return r('NOT_FOUND')
  }

  return r('OK', { data: res.tasks[0] })
}

export async function runTaskCommand(
  client: ECSClient,
  env: Pick<
    ENV,
    | 'AWS_SECURITY_GROUP_ID'
    | 'AWS_SUBNET_ID'
    | 'AWS_ECS_INFRASTRUCTURE_ROLE_ARN'
  >,
  input: { snapshotId: string; projectTagId: string }
) {
  const command = new RunTaskCommand({
    cluster: ECS_CLUSTER,
    taskDefinition: ECS_TASK_DEFINITION,
    launchType: ECS_LAUNCH_TYPE,
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        securityGroups: [env.AWS_SECURITY_GROUP_ID],
        subnets: [env.AWS_SUBNET_ID],
        assignPublicIp: 'ENABLED',
      },
    },
    volumeConfigurations: [
      {
        name: 'workspace',
        managedEBSVolume: {
          tagSpecifications: [
            {
              resourceType: 'volume',
              tags: [
                { key: 'type', value: 'project' },
                {
                  key: 'id',
                  value: input.projectTagId,
                },
              ],
            },
          ],
          volumeType: 'gp2',
          encrypted: false,
          snapshotId: input.snapshotId,
          filesystemType: 'ext4',
          sizeInGiB: 10,
          roleArn: env.AWS_ECS_INFRASTRUCTURE_ROLE_ARN,
          terminationPolicy: {
            deleteOnTermination: false,
          },
        },
      },
    ],
  })

  const res = await client.send(command)

  if (!res.tasks || res.tasks.length === 0) {
    return r('NOT_CREATED')
  }

  return r('OK', { data: res.tasks[0] })
}
