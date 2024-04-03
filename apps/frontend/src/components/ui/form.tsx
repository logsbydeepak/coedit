import React from 'react'
import { XIcon } from 'lucide-react'

import { cn } from '#/utils/style'

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
      'w-full rounded-md border border-gray-4 bg-gray-1 px-3 py-1.5 placeholder:text-gray-9 focus:outline-sage-9',
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
        className="inline-flex items-center rounded-full text-xs font-medium text-red-11"
      >
        <span className="mr-1 size-3">
          <XIcon strokeWidth={3} />
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
