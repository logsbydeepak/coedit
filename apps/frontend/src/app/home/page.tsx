import Link from 'next/link'

import { LogoIcon } from '#/components/icons/logo'
import { buttonStyle } from '#/components/ui/button'
import { cn } from '#/utils/style'

export default function Page() {
  return (
    <div className="absolute flex min-h-full w-full items-center justify-center">
      <div className="flex w-80 flex-col space-y-6 p-4">
        <div className="flex items-center justify-center space-x-2 text-sage-9">
          <LogoIcon className="size-6" />
          <p className="text-center font-mono text-xl font-medium text-white">
            coedit
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/register"
            className={cn(
              buttonStyle({ intent: 'primary' }),
              'w-full font-mono'
            )}
          >
            Register
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonStyle({ intent: 'secondary' }),
              'w-full font-mono'
            )}
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}
