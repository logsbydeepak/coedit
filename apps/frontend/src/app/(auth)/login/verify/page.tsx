'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Head } from '#/components/head'
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
  const { isPending } = useMutation({
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
    console.log(data)
  }

  return (
    <>
      <Head title="Login code" />

      <Heading>Enter code to login</Heading>
      <FormRoot onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
        <FormFieldset className="space-y-2.5">
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
            Login
          </Button>
        </FormFieldset>
      </FormRoot>
    </>
  )
}
