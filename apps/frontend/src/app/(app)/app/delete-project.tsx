import React from 'react'

import { Button } from '#/components/ui/button'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogRoot,
  DialogTitle,
} from '#/components/ui/dialog'
import { useAppStore } from '#/store/app'
import { Project } from '#/utils/types'

export function DeleteProjectDialog() {
  const deleteProject = useAppStore((s) => s.dialog.deleteProject)
  const setDialog = useAppStore((s) => s.setDialog)
  const [isPending, startTransition] = React.useTransition()

  const isOpen = !!deleteProject

  const closeDialog = () => {
    if (isPending) return
    setDialog({ deleteProject: null })
  }

  if (deleteProject === null) return

  return (
    <DialogRoot open={isOpen} onOpenChange={closeDialog}>
      <DialogContent className="space-y-4 text-center">
        <Content
          project={deleteProject}
          handleClose={closeDialog}
          isPending={isPending}
          startTransition={startTransition}
        />
      </DialogContent>
    </DialogRoot>
  )
}

function Content({
  isPending,
  startTransition,
  project,
}: {
  handleClose: () => void
  isPending: boolean
  startTransition: React.TransitionStartFunction
  project: Project
}) {
  const handleProject = () => {
    startTransition(async () => {})
  }

  return (
    <>
      <div>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogDescription>
          Are you sure you want to
          <i> {project.name} </i>delete?
        </DialogDescription>
      </div>

      <fieldset className="flex space-x-4" disabled={isPending}>
        <DialogClose asChild>
          <Button intent="secondary" className="w-full">
            Cancel
          </Button>
        </DialogClose>
        <Button
          className="w-full"
          isLoading={isPending}
          onClick={handleProject}
        >
          Submit
        </Button>
      </fieldset>
    </>
  )
}
