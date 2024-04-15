import { db, dbSchema } from '#/db'
import { h, hAuth, r } from '#/utils/h'

const create = hAuth().post('/', async (c) => {})
const get = hAuth().get('/:id', async (c) => {})
const getAll = hAuth().get('/', async (c) => {})
const update = hAuth().put('/:id', async (c) => {})
const remove = hAuth().delete('/:id', async (c) => {})

const baseProjects = h().get('/', async (c) => {
  const projects = await db(c.env).select().from(dbSchema.baseProjects)
  return c.json(
    r('OK', {
      projects,
    })
  )
})

export const projectRoute = h()
  .route('/base', baseProjects)
  .route('/', create)
  .route('/', get)
  .route('/', getAll)
  .route('/', update)
  .route('/', remove)
