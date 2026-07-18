import { h } from '#/utils/h'

import { startProject } from './start'
import { stopProject } from './stop'

export const projectRoute = h().route('/', startProject).route('/', stopProject)
