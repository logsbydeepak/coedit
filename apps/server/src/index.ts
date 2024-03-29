import { userRoute } from './route/user'
import { authRoute } from './route/auth'
import { h } from './utils/h'

const app = h().route('/user', userRoute).route('/auth', authRoute)

export type AppType = typeof app
export default app
