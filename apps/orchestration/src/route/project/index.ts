import { h } from '#/utils/h'

import { startProject } from './start'

export const projectRoute = h().route('/', startProject)
