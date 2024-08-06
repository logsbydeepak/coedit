import { h } from '#/utils/h'

import { createProject } from './create'
import { deleteProject } from './delete'
import { startProject } from './start'

export const projectRoute = h()
  .route('/', deleteProject)
  .route('/', createProject)
  .route('/', startProject)
