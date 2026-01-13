import { LogoIcon } from '#/components/icons/logo'

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <div className="absolute flex min-h-full w-full items-center justify-center">
      <div className="border-gray-1 flex w-96 flex-col space-y-4 p-6">
        <div className="flex justify-center">
          <LogoIcon className="text-sage-9 size-10" />
        </div>

        {children}
      </div>
    </div>
  )
}
