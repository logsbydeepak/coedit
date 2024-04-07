import { cn } from '#/utils/style'

function genInitials(name: string) {
  if (name.length >= 2) {
    return `${name[0]}${name[1]}`.toUpperCase()
  }
  return name[0].toUpperCase()
}

export function Avatar({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const initials = genInitials(name)

  return (
    <div
      className={cn(
        'group flex size-full select-none items-center justify-center rounded-full border border-gray-5 bg-gray-1 hover:border-gray-6 hover:bg-gray-2',
        className
      )}
    >
      <p className="text-[80%] font-medium tracking-wider text-gray-11 group-hover:text-gray-12">
        {initials}
      </p>
    </div>
  )
}
