'use client'

import { useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { zEmail, zReqString } from '@coedit/zschema'

import { Head } from '#/components/head'
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
import { apiClient } from '#/utils/hc'

import { Heading } from '../../_component'

const zSchema = z.object({
  code: z.string({ required_error: 'required' }).length(6, 'required'),
})

type FromValues = z.infer<typeof zSchema>

export default function Page() {
  const { alert, setAlert } = useAlert()
  const searchParams = useSearchParams()

  const { isPending, mutateAsync } = useMutation({
    mutationFn: apiClient.auth.register.verify.$post,
  })

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FromValues>({
    resolver: zodResolver(zSchema),
  })

  const onSubmit = async (data: FromValues) => {
    try {
      const email = searchParams.get('email')
      const name = searchParams.get('name')

      const schema = z.object({
        email: zEmail,
        name: zReqString,
      })

      const isValidParams = schema.safeParse({
        email,
        name,
      })

      if (!isValidParams.success) {
        setAlert({
          type: 'destructive',
          message: 'Invalid email!',
        })
        return
      }

      const res = await mutateAsync({
        json: {
          code: data.code,
          email: isValidParams.data.email,
          name: isValidParams.data.name,
        },
      })
      const resData = await res.json()

      switch (resData.code) {
        case 'OK':
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
  }

  return (
    <>
      <Head title="Register code" />
      <Alert {...alert} align="center" />

      <Heading>Enter code to register</Heading>
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
      </FormRoot>
    </>
  )
}
