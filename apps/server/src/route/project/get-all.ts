import { desc, eq } from 'drizzle-orm'

import { db, dbSchema } from '@coedit/db'
import { r } from '@coedit/r'

import { hAuth } from '#/utils/h'

export const getAllProject = hAuth().get('/', async (c) => {
  const userId = c.get('x-userId')

  const dbProjects = await db(c.env)
    .select()
    .from(dbSchema.projects)
    .where(eq(dbSchema.projects.userId, userId))
    .orderBy(desc(dbSchema.projects.createdAt))

  if (!dbProjects) {
    return c.json(r('OK', { projects: [] }))
  }

  const projects = dbProjects.map((project) => ({
    name: project.name,
    id: project.id,
  }))

  return c.json(r('OK', { projects: projects }))
})
