'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { z, zEmail, zReqString } from '@coedit/zschema'

import { Alert, useAlert } from '#/components/icons/alert'
import { Button } from '#/components/ui/button'
import {
  FormError,
  FormFieldset,
  FormLabel,
  FormRoot,
} from '#/components/ui/form'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '#/components/ui/input-otp'
import { apiClient } from '#/utils/hc-client'

const zSchema = z.object({
  code: zReqString.length(6, 'required'),
  name: zReqString,
  email: zEmail,
})

type FromValues = z.infer<typeof zSchema>

export function Form({ name, email }: { name: string; email: string }) {
  const router = useRouter()
  const { alert, setAlert } = useAlert()
  const [isPending, startTransition] = React.useTransition()

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FromValues>({
    resolver: zodResolver(zSchema),
    defaultValues: {
      name,
      email,
    },
  })

  const onSubmit = async (data: FromValues) => {
    startTransition(async () => {
      try {
        const res = await apiClient.auth.register.verify.$post({
          json: {
            code: data.code,
            email: data.email,
            name: data.name,
          },
        })

        const resData = await res.json()

        switch (resData.code) {
          case 'OK':
            router.push('/')
            return
          case 'CODE_EXPIRED':
            setAlert({
              type: 'destructive',
              message: 'Code expired!',
            })
            return
          case 'CODE_NOT_MATCH':
            setAlert({
              type: 'destructive',
              message: 'Code not match!',
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
          <FormLabel htmlFor="code">Code</FormLabel>
          <InputOTP
            maxLength={6}
            containerClassName="justify-between"
            value={watch('code')}
            onChange={(value) => setValue('code', value)}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <FormError>{errors.code?.message}</FormError>
        </FormFieldset>

        <FormFieldset disabled={isPending}>
          <Button
            type="submit"
            className="w-full font-mono"
            isLoading={isPending}
          >
            Register
          </Button>
        </FormFieldset>

        <p className="text-sm text-gray-11 text-center text-balance">
          check your email inbox and spam folder for the code
        </p>
      </FormRoot>
    </>
  )
}
