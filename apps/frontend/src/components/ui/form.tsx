import React from 'react'
import { XIcon } from 'lucide-react'

import { cn } from '#/utils/style'

function FormRoot({
  children,
  className,
  ...props
}: React.ComponentProps<'form'>) {
  return (
    <form {...props} className={cn('w-full', className)}>
      {children}
    </form>
  )
}

function FormInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'w-full rounded-md border border-gray-4 bg-gray-1 px-3 py-1.5 placeholder:text-gray-9 focus:outline-sage-9',
        className
      )}
      {...props}
    />
  )
}

function FormLabel({ children, ...props }: React.ComponentProps<'label'>) {
  return (
    <label {...props} className="text-sm">
      {children}
    </label>
  )
}

function FormError({
  children,
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <>
      {children && (
        <p
          className={cn(
            'inline-flex items-center rounded-full text-xs font-medium text-red-11',
            className
          )}
          {...props}
        >
          <span className="mr-1 size-3">
            <XIcon strokeWidth={3} />
          </span>
          {children}
        </p>
      )}
    </>
  )
}

function FormFieldset({
  children,
  ...props
}: React.ComponentProps<'fieldset'>) {
  return <fieldset {...props}>{children}</fieldset>
}

export { FormRoot, FormInput, FormLabel, FormError, FormFieldset }
