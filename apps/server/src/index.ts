import { authRoute } from './route/auth'
import { projectRoute } from './route/project'
import { userRoute } from './route/user'
import { h } from './utils/h'

const app = h()
  .route('/user', userRoute)
  .route('/auth', authRoute)
  .route('/project', projectRoute)

export type AppType = typeof app
export default app
