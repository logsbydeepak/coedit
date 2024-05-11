import { Hono } from 'hono'

export const hono = () => new Hono()

export const h = () => hono()
