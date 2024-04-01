import React from 'react'
import { XCircleIcon } from 'lucide-react'

import { cn } from '@/utils/style'

const FormRoot = React.forwardRef<
  HTMLFormElement,
  React.FormHTMLAttributes<HTMLFormElement>
>(({ children, className, ...props }, ref) => (
  <form {...props} ref={ref} className={cn('w-full', className)}>
    {children}
  </form>
))
FormRoot.displayName = 'FormRoot'

const FormInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    {...props}
    className={cn(
      'mb-2 mt-0.5 w-full rounded-md border border-gray-4 px-3 py-1 ring-offset-4 ring-offset-black placeholder:text-sm placeholder:text-gray-11 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-9 disabled:text-gray-9',
      className
    )}
  />
))
FormInput.displayName = 'FormInput'

const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ children, ...props }, ref) => (
  <label {...props} ref={ref} className="text-sm">
    {children}
  </label>
))
FormLabel.displayName = 'FormLabel'

const FormError = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ children, ...props }, ref) => (
  <>
    {children && (
      <p
        {...props}
        ref={ref}
        className="inline-flex items-center rounded-full bg-red-2 px-2 py-0.5 text-xs font-medium text-red-11"
      >
        <span className="mr-1 size-2">
          <XCircleIcon strokeWidth={3} />
        </span>
        {children}
      </p>
    )}
  </>
))
FormError.displayName = 'FormError'

function FormFieldset({
  children,
  ...props
}: React.FieldsetHTMLAttributes<HTMLFieldSetElement>) {
  return <fieldset {...props}>{children}</fieldset>
}

export { FormRoot, FormInput, FormLabel, FormError, FormFieldset }
