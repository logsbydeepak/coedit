import React from 'react'
import { toast } from 'sonner'

import { Head } from '#/components/head'
import { Alert, useAlert } from '#/components/icons/alert'
import { queryClient } from '#/components/provider'
import { Button } from '#/components/ui/button'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogRoot,
  DialogTitle,
} from '#/components/ui/dialog'
import { useAppStore } from '#/store/app'
import { apiClient } from '#/utils/hc-client'
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
  handleClose,
}: {
  handleClose: () => void
  isPending: boolean
  startTransition: React.TransitionStartFunction
  project: Project
}) {
  const { alert, setAlert } = useAlert()
  const handleProject = () => {
    startTransition(async () => {
      try {
        const res = await apiClient.project[':id'].$delete({
          param: {
            id: project.id,
          },
        })

        const resData = await res.json()

        switch (resData.code) {
          case 'OK':
            toast.success('Project deleted successfully')
            queryClient.invalidateQueries({ queryKey: ['projects'] })
            handleClose()
            break
          case 'INVALID_PROJECT_ID':
            setAlert({
              type: 'destructive',
              message: 'Invalid project id',
            })
            break
          default:
            throw new Error('Something went wrong!')
        }
      } catch (e) {
        setAlert({
          type: 'destructive',
          message: 'Something went wrong!',
        })
      }
    })
  }

  return (
    <>
      <Head title={`delete ${project.name}`} />
      <div>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogDescription>
          Are you sure you want to
          <i> {project.name} </i>delete?
        </DialogDescription>
      </div>

      <Alert align="center" {...alert} />

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
          Delete
        </Button>
      </fieldset>
    </>
  )
}
