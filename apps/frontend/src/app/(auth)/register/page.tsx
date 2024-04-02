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
  FormInput,
  FormLabel,
  FormRoot,
} from '#/components/ui/form'
import { apiClient } from '#/utils/hc'

import { Heading } from '../_component'

const zSchema = z.object({
  email: z.string().email(),
})

type FromValues = z.infer<typeof zSchema>

export default function Page() {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: apiClient.auth.register.$post,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FromValues>({
    resolver: zodResolver(zSchema),
  })

  const onSubmit = async (data: FromValues) => {
    const res = await mutateAsync({
      json: {
        email: data.email,
      },
    })
    const resData = await res.json()
    console.log(resData)
  }

  return (
    <>
      <Head title="Register" />
      <Heading>Register</Heading>
      <FormRoot onSubmit={handleSubmit(onSubmit)} className="space-y-5 w-full">
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
          <Button type="submit" className="w-full" isLoading={isPending}>
            Submit
          </Button>
        </FormFieldset>
      </FormRoot>
    </>
  )
}
