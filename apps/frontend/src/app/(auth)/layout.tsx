import { LogoIcon } from '#/components/icons/logo'

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <div className="absolute flex min-h-full w-full items-center justify-center">
      <div className="flex w-96 flex-col space-y-4 border-gray-1 p-6">
        <div className="flex justify-center">
          <LogoIcon className="size-10 text-sage-9" />
        </div>

        {children}
      </div>
    </div>
  )
}
