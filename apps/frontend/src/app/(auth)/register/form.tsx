'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { zEmail, zReqString } from '@coedit/zschema'

import { Alert, useAlert } from '#/components/icons/alert'
import { Button } from '#/components/ui/button'
import {
  FormError,
  FormFieldset,
  FormInput,
  FormLabel,
  FormRoot,
} from '#/components/ui/form'
import { apiClient } from '#/utils/hc-client'

const zSchema = z.object({
  email: zEmail,
  name: zReqString,
})

type FromValues = z.infer<typeof zSchema>

export function Form() {
  const [isPending, startTransition] = React.useTransition()
  const { alert, setAlert } = useAlert()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FromValues>({
    resolver: zodResolver(zSchema),
  })

  const onSubmit = async (data: FromValues) => {
    startTransition(async () => {
      try {
        const res = await apiClient.auth.register.$post({
          json: {
            email: data.email,
            name: data.name,
          },
        })

        const resData = await res.json()

        switch (resData.code) {
          case 'OK':
            router.push(
              `/register/verify?email=${data.email}&name=${data.name}`
            )
            return

          case 'EMAIL_ALREADY_SENT':
            setAlert({
              type: 'destructive',
              message: 'Email already sent!',
            })
            return

          case 'USER_ALREADY_EXIST':
            setAlert({
              type: 'destructive',
              message: 'User already exist!',
            })
            return

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

  React.useEffect(() => {
    if (isPending) setAlert('close')
  }, [isPending, setAlert])

  return (
    <>
      <Alert {...alert} align="center" />

      <FormRoot onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
        <FormFieldset className="space-y-1" disabled={isPending}>
          <FormLabel htmlFor="name">Name</FormLabel>
          <FormInput
            {...register('name')}
            id="name"
            name="name"
            placeholder="Haven"
          />
          <FormError>{errors.name?.message}</FormError>
        </FormFieldset>

        <FormFieldset className="space-y-1" disabled={isPending}>
          <FormLabel htmlFor="email">Email</FormLabel>
          <FormInput
            {...register('email')}
            id="email"
            name="email"
            placeholder="abc@example.com"
          />
          <FormError>{errors.email?.message}</FormError>
        </FormFieldset>

        <FormFieldset disabled={isPending}>
          <Button
            type="submit"
            className="w-full font-mono"
            isLoading={isPending}
          >
            Continue
          </Button>
        </FormFieldset>
      </FormRoot>
      <div className="text-center">
        <Link
          href="/login"
          className="text-sm font-medium text-gray-11 hover:text-gray-12"
        >
          Login?
        </Link>
      </div>
    </>
  )
}
