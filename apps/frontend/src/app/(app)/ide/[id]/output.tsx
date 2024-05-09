import React from 'react'
import { useAtomValue } from 'jotai'
import { CircleStopIcon, LoaderIcon, PlayIcon, SquareIcon } from 'lucide-react'

import { publicIPAtom } from '../store'

export default function Output() {
  const ref = React.useRef<HTMLDivElement>(null)
  const [isRunning, setIsRunning] = React.useState(false)
  const publicIP = useAtomValue(publicIPAtom)

  React.useEffect(() => {
    return () => {
      if (!ref.current) return
      if (ref.current.children.length === 0) return
      ref.current.removeChild(ref.current.children[0])
    }
  }, [])

  React.useEffect(() => {
    if (!ref.current) return

    if (isRunning) {
      const iframe = document.createElement('iframe')
      iframe.setAttribute('src', `http://${publicIP.split(':')[0]}:3000`)
      iframe.className = 'size-full'
      ref.current.appendChild(iframe)
    } else {
      if (ref.current.children.length === 0) return
      ref.current.removeChild(ref.current.children[0])
    }
  }, [isRunning])

  return (
    <div className="size-full flex flex-col">
      {!isRunning && (
        <Container>
          <Status>no preview</Status>
        </Container>
      )}
      {isRunning && <div ref={ref} className="size-full"></div>}

      <div className="flex justify-between text-sm space-x-2 items-center">
        <button
          className="flex size-6 items-center justify-center text-gray-11 ring-inset hover:bg-sage-4 hover:text-gray-12 hover:ring-1 hover:ring-sage-9 w-full space-x-2"
          onClick={() => setIsRunning((prev) => !prev)}
        >
          <span className="size-3">
            {isRunning ? <SquareIcon /> : <PlayIcon />}
          </span>
          <p>{isRunning ? 'closer' : 'preview'}</p>
        </button>
        <p className="text-xs text-gray-11 px-2">3000</p>
      </div>
    </div>
  )
}

function Container({ children }: React.HtmlHTMLAttributes<HTMLDivElement>) {
  return (
    <div className="flex size-full items-center justify-center pt-14 text-center">
      {children}
    </div>
  )
}

function Status({
  children,
  isLoading = false,
}: React.PropsWithChildren<{ isLoading?: boolean }>) {
  return (
    <div className="flex items-center space-x-1 rounded-full bg-gray-5 px-3 py-1 font-mono text-xs">
      {isLoading && <LoaderIcon className="size-3 animate-spin text-gray-11" />}
      <p>{children}</p>
    </div>
  )
}
