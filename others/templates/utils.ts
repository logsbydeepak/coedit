import { parseArgs } from 'util'
import { ulid } from 'ulidx'

import { db, dbSchema } from '@coedit/db'

async function main() {
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      type: {
        type: 'string',
      },
      id: {
        type: 'string',
      },
      name: {
        type: 'string',
      },
    },
    strict: true,
    allowPositionals: true,
  })

  if (values.type === 'clean') {
    await db({
      DB_URL: process.env.DB_URL!,
    }).delete(dbSchema.templates)
  }

  if (values.type === 'insert') {
    if (values.id && values.name) {
      await db({
        DB_URL: process.env.DB_URL!,
      })
        .insert(dbSchema.templates)
        .values({
          id: values.id,
          name: values.name,
        })
    }
  }

  if (values.type === 'id') {
    console.log(ulid())
  }
}
main()
