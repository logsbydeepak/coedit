import { r } from '@coedit/r'

import {
  getPublicSnapshot,
  restartAll,
  restartDevbox,
  restartLanguages,
} from '#/utils/environment'
import { h } from '#/utils/h'

// Read-only snapshot, never triggers or retries an install itself.
const get = h().get('/', (c) => {
  return c.json(r('OK', getPublicSnapshot()))
})

// Explicit user action is the only way a failed install gets retried.
const restart = h().post('/restart', async (c) => {
  const snapshot = await restartAll()
  return c.json(r('OK', snapshot))
})

const restartDevboxRoute = h().post('/devbox/restart', async (c) => {
  const snapshot = await restartDevbox()
  return c.json(r('OK', snapshot))
})

const restartLspRoute = h().post('/lsp/restart', async (c) => {
  const snapshot = await restartLanguages()
  return c.json(r('OK', snapshot))
})

export const environmentRoute = h()
  .route('/', get)
  .route('/', restart)
  .route('/', restartDevboxRoute)
  .route('/', restartLspRoute)
