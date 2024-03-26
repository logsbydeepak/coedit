import { Hono } from 'hono'
import { usersApp } from './route/user'

const app = new Hono().route('/user', usersApp)

export type AppType = typeof app
export default app
