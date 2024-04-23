'use client'

import { DeleteProjectDialog } from './app/delete-project'
import { EditProjectDialog } from './app/edit-project'
import { NewProjectDialog } from './app/new-project'

export function AllDialog() {
  return (
    <>
      <NewProjectDialog />
      <DeleteProjectDialog />
      <EditProjectDialog />
    </>
  )
}
