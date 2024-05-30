'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { z, zLogin } from '@coedit/zschema'

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

type FromValues = z.infer<typeof zLogin>

export function Form() {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const { alert, setAlert } = useAlert()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FromValues>({
    resolver: zodResolver(zLogin),
  })

  const onSubmit = async (data: FromValues) => {
    startTransition(async () => {
      try {
        const res = await apiClient.auth.login.$post({
          json: {
            email: data.email,
          },
        })

        const resData = await res.json()
        switch (resData.code) {
          case 'OK':
            router.push(`/login/verify?email=${data.email}`)
            return

          case 'EMAIL_ALREADY_SENT':
            setAlert({
              type: 'destructive',
              message: 'Email already sent!',
            })
            return

          case 'USER_NOT_FOUND':
            setAlert({
              type: 'destructive',
              message: 'User not found!',
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

  return (
    <>
      <Alert {...alert} align="center" />

      <FormRoot onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
        <FormFieldset className="space-y-2.5" disabled={isPending}>
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
          href="/register"
          className="text-sm font-medium text-gray-11 hover:text-gray-12"
        >
          Register?
        </Link>
      </div>
    </>
  )
}
