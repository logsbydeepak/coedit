import React from 'react'
import { cva, VariantProps } from 'cva'
import { CheckIcon } from 'lucide-react'

import { ExclamationIcon } from '#/components/icons/exclamation'
import { cn } from '#/utils/style'

const alertStyle = cva({
  base: 'flex w-full items-center space-x-2 rounded-lg px-4 py-2 text-xs font-medium',
  variants: {
    intent: {
      success: 'bg-green-3 text-green-11',
      destructive: 'bg-red-3 text-red-11',
    },
    align: {
      right: 'justify-start',
      center: 'justify-center',
    },
  },
  defaultVariants: {
    intent: 'destructive',
    align: 'right',
  },
})

type AlertStyleProps = VariantProps<typeof alertStyle>

type Alert =
  | {
      isOpen: true
      type: AlertStyleProps['intent']
      message: string
      align: AlertStyleProps['align']
    }
  | { isOpen: false }

export function useAlert(alert?: {
  type: AlertStyleProps['intent']
  message: string
}) {
  const [_alert, _setAlert] = React.useState<
    | {
        isOpen: true
        type: AlertStyleProps['intent']
        message: string
      }
    | { isOpen: false }
  >(() => {
    if (!alert) {
      return {
        isOpen: false,
      }
    }

    if ('message' in alert) {
      return {
        isOpen: true,
        ...alert,
      }
    }

    return {
      isOpen: false,
    }
  })

  const setAlert = React.useCallback(
    (
      a:
        | {
            message: string
            type: AlertStyleProps['intent']
          }
        | 'close'
    ) => {
      if (typeof a === 'string') {
        return _setAlert({
          isOpen: false,
        })
      }

      _setAlert({
        isOpen: true,
        message: a.message,
        type: a.type,
      })
    },
    []
  )

  return {
    alert: _alert,
    setAlert,
  }
}

export function Alert(
  props: (
    | {
        message: string
        type: AlertStyleProps['intent']
        isOpen: true
      }
    | { isOpen: false }
  ) & {
    align: AlertStyleProps['align']
  }
) {
  if (!props.isOpen) {
    return null
  }

  return (
    <div className={cn(alertStyle({ intent: props.type, align: props.align }))}>
      <div className="*:fle*:items-center *:justify-center *:rounded-full *:p-0.5">
        {props.type === 'destructive' && (
          <div className="bg-red-11">
            <ExclamationIcon className="size-2.5 text-red-1" />
          </div>
        )}
        {props.type === 'success' && (
          <div className="bg-green-11">
            <CheckIcon className="size-2.5 text-green-1" />
          </div>
        )}
      </div>

      <p>{props.message}</p>
    </div>
  )
}
