import { Hono } from 'hono'
import { usersApp } from './route/user'
import { authRoute } from './route/auth'

const app = new Hono().route('/user', usersApp).route('/auth', authRoute)

export type AppType = typeof app
export default app
