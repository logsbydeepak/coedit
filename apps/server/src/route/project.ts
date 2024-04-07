import { h, hAuth } from '#/utils/h'

const create = hAuth().post('/', async (c) => {})
const get = hAuth().get('/:id', async (c) => {})
const getAll = hAuth().get('/', async (c) => {})
const update = hAuth().put('/:id', async (c) => {})
const remove = hAuth().delete('/:id', async (c) => {})

export const projectRoute = h()
  .route('/', create)
  .route('/', get)
  .route('/', getAll)
  .route('/', update)
  .route('/', remove)
