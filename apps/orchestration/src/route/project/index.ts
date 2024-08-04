import { h } from '#/utils/h'

import { createProject } from './create'
import { deleteProject } from './delete'

export const projectRoute = h()
  .route('/', deleteProject)
  .route('/', createProject)
