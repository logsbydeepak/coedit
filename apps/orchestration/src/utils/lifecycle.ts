import { tryCatch } from '@coedit/r'
import { z } from '@coedit/zschema'

import { docker } from './config'
import { log } from './log'

const labelSchema = z.object({
  Actor: z.object({
    Attributes: z.object({
      identifier: z.string(),
      exitCode: z.string().optional(),
    }),
  }),
})

docker.getEvents(
  {
    filters: {
      type: ['container'],
      event: ['die'],
    },
  },
  (err, stream) => {
    if (err || !stream) {
      log.error(
        {
          error: err,
        },
        'CONTAINER_STREAM_ERROR'
      )
      process.exit(1)
    }

    stream.on('data', async function(chunk) {
      const event = await tryCatch(JSON.parse(chunk))
      const parsed = labelSchema.safeParse(event)

      if (parsed.error) {
        log.error({ error: parsed.error }, 'ERROR_PARSING_EVENT')
        process.exit(1)
      }

      const { identifier, exitCode } = parsed.data.Actor.Attributes
      const [userId, projectId] = identifier.split(':', 2)

      if (!userId || !projectId) {
        log.error({ error: parsed.error }, 'IDENTIFIER_NOT_FOUND')
        process.exit(1)
      }


    })
  }
)
