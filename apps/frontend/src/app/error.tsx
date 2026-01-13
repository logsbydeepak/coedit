'use client'

import { startTransition } from 'react'
import { useRouter } from 'next/navigation'

import { Alert } from '#/components/icons/alert'
import { LogoIcon } from '#/components/icons/logo'
import { Button } from '#/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  function handleReset() {
    startTransition(() => {
      router.refresh()
      reset()
    })
  }

  return (
    <div className="absolute flex min-h-full w-full items-center justify-center text-center">
      <div className="flex w-80 flex-col space-y-6 p-4">
        <div className="flex items-center justify-center space-x-2">
          <div className="text-sage-9 flex items-center justify-center space-x-2">
            <LogoIcon className="size-6" />
            <p className="text-center font-mono text-xl font-medium text-white">
              coedit
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Alert
            message="Something went wrong!"
            type="destructive"
            isOpen
            align="center"
          />
          <Button className="w-full" intent="secondary" onClick={handleReset}>
            Tray again
          </Button>
        </div>
      </div>
    </div>
  )
}
