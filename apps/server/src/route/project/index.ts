import { h } from '#/utils/h'

import { createProject } from './create'
import { deleteProject } from './delete'
import { editProject } from './edit'
import { getAllProject } from './get-all'
import { startProject } from './start'
import { projectStatus } from './status'

export const projectRoute = h()
  .route('/', projectStatus)
  .route('/', deleteProject)
  .route('/', editProject)
  .route('/', createProject)
  .route('/', startProject)
  .route('/', getAllProject)
