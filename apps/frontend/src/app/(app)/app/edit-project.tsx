'use client'

import React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { zReqString } from '@coedit/zschema'

import { Head } from '#/components/head'
import { Alert, useAlert } from '#/components/icons/alert'
import { Button } from '#/components/ui/button'
import {
  DialogClose,
  DialogContent,
  DialogRoot,
  DialogTitle,
} from '#/components/ui/dialog'
import { FormError, FormInput, FormLabel, FormRoot } from '#/components/ui/form'
import { useAppStore } from '#/store/app'
import { apiClient } from '#/utils/hc-client'
import { Project } from '#/utils/types'

export function EditProjectDialog() {
  const editProject = useAppStore((s) => s.dialog.editProject)
  const setDialog = useAppStore((s) => s.setDialog)
  const [isPending, startTransition] = React.useTransition()

  const isOpen = !!editProject

  const closeDialog = () => {
    if (isPending) return
    setDialog({ newProject: false })
  }

  if (!editProject) return

  return (
    <DialogRoot open={isOpen} onOpenChange={closeDialog}>
      <DialogContent className="space-y-5">
        <Content
          project={editProject}
          isPending={isPending}
          startTransition={startTransition}
          handleClose={closeDialog}
        />
      </DialogContent>
    </DialogRoot>
  )
}

const zSchema = z.object({
  name: zReqString,
  templateId: zReqString,
})

type FormValues = z.infer<typeof zSchema>

function Content({
  handleClose,
  startTransition,
  isPending,
  project,
}: {
  handleClose: () => void
  isPending: boolean
  startTransition: React.TransitionStartFunction
  project: Project
}) {
  const queryClient = useQueryClient()
  const { alert, setAlert } = useAlert()

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<FormValues>({
    resolver: zodResolver(zSchema),
    defaultValues: {
      name: project.name,
      templateId: project.id,
    },
  })

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        const res = await apiClient.project[':id'].$post({
          json: {
            name: data.name,
          },
          param: {
            id: data.templateId,
          },
        })

        const resData = await res.json()

        queryClient.invalidateQueries({ queryKey: ['projects'] })

        switch (resData.code) {
          case 'OK':
            toast.success('Project edited successfully')
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
      <Head title={`Edit ${project.name}`} />
      <div>
        <DialogTitle>Edit Project</DialogTitle>
      </div>

      <Alert align="center" {...alert} />

      <FormRoot onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2.5">
          <FormLabel htmlFor="firstName">Name</FormLabel>
          <FormInput
            autoFocus
            id="name"
            {...register('name')}
            placeholder="my app"
          />
          <FormError>{errors.name?.message}</FormError>
        </div>

        <fieldset className="flex space-x-4" disabled={isPending}>
          <DialogClose asChild>
            <Button intent="secondary" className="w-full">
              Cancel
            </Button>
          </DialogClose>
          <Button className="w-full" isLoading={isPending}>
            Save
          </Button>
        </fieldset>
      </FormRoot>
    </>
  )
}
