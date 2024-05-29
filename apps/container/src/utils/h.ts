import { Hono } from 'hono'

const hono = () => new Hono()

export const h = () => hono()
