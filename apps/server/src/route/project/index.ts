import { h } from '#/utils/h'

import { createProject } from './create'
import { deleteProject } from './delete'
import { editProject } from './edit'
import { getAllProject } from './get-all'
import { startProject } from './start'
import { statusProject } from './status'
import { stopProject } from './stop'

export const projectRoute = h()
  .route('/', deleteProject)
  .route('/', editProject)
  .route('/', createProject)
  .route('/', startProject)
  .route('/', statusProject)
  .route('/', stopProject)
  .route('/', getAllProject)
