import { authRoute } from './route/auth'
import { userRoute } from './route/user'
import { h } from './utils/h'

const app = h().route('/user', userRoute).route('/auth', authRoute)

export type AppType = typeof app
export default app
