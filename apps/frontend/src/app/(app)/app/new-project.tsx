'use client'

import React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import * as RadioGroup from '@radix-ui/react-radio-group'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { zReqString } from '@coedit/zschema'

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

export function NewProjectDialog() {
  const isOpen = useAppStore((s) => s.dialog.newProject)
  const setDialog = useAppStore((s) => s.setDialog)
  const [isPending, startTransition] = React.useTransition()

  const closeDialog = () => {
    setDialog({ newProject: false })
  }

  return (
    <DialogRoot open={isOpen} onOpenChange={closeDialog}>
      <DialogContent className="space-y-5">
        <Content
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
}: {
  handleClose: () => void
  isPending: boolean
  startTransition: React.TransitionStartFunction
}) {
  const {
    register,
    formState: { errors },
    getValues,
    setValue,
    handleSubmit,
  } = useForm<FormValues>({
    resolver: zodResolver(zSchema),
  })

  const onSubmit = () => {}

  return (
    <>
      <div>
        <DialogTitle>New Project</DialogTitle>
      </div>

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

        <div className="space-y-2.5">
          <FormLabel>Template</FormLabel>
          <Templates
            value={getValues('templateId')}
            onChange={(value) => {
              setValue('templateId', value)
            }}
          />
          <FormError>{errors.templateId?.message}</FormError>
        </div>

        <fieldset className="flex space-x-4" disabled={isPending}>
          <DialogClose asChild>
            <Button intent="secondary" className="w-full">
              Cancel
            </Button>
          </DialogClose>
          <Button className="w-full" isLoading={isPending}>
            Submit
          </Button>
        </fieldset>
      </FormRoot>
    </>
  )
}

function Templates({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const { isLoading, data } = useQuery({
    queryFn: async () => {
      try {
        const res = await apiClient.template.$get()
        const resData = await res.json()
        return resData
      } catch (e) {
        throw new Error('Something went wrong!')
      }
    },
    queryKey: ['templates'],
    throwOnError: true,
  })

  if (isLoading) {
    return <p>Loading....</p>
  }

  if (!data) {
    return <p>Something went wrong!</p>
  }

  return (
    <RadioGroup.Root
      className="grid grid-cols-2 gap-6"
      value={value}
      defaultValue={data.projects[0].id}
      onValueChange={onChange}
    >
      {data.projects.map((template) => (
        <RadioGroup.Item
          key={template.id}
          value={template.id}
          id={template.id}
          className="flex h-8 items-center rounded-md border border-gray-5 p-4 focus-visible:outline-2 focus-visible:outline-offset-[6px] focus-visible:outline-gray-5 data-[state=checked]:border-sage-9 data-[state=checked]:bg-sage-3 data-[state=checked]:ring-1 data-[state=checked]:ring-sage-9"
        >
          <p>{template.name}</p>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  )
}
