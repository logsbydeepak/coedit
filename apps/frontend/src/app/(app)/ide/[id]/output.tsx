import React from 'react'
import { ExternalLinkIcon, PlayIcon, SquareIcon } from 'lucide-react'

import { Status, StatusContainer } from './components'
import { containerURL } from './store'

export default function Output() {
  const ref = React.useRef<HTMLDivElement>(null)
  const [isRunning, setIsRunning] = React.useState(false)

  React.useEffect(() => {
    if (!ref.current) return
    const iframe = ref.current
    if (iframe.children.length === 0) return
    return () => {
      iframe.removeChild(iframe.children[0])
    }
  }, [])

  React.useEffect(() => {
    if (!ref.current) return

    if (isRunning) {
      const iframe = document.createElement('iframe')
      iframe.setAttribute('src', containerURL().output)
      iframe.className = 'size-full'
      ref.current.appendChild(iframe)
    } else {
      if (ref.current.children.length === 0) return
      ref.current.removeChild(ref.current.children[0])
    }
  }, [isRunning])

  return (
    <div className="flex size-full flex-col">
      {!isRunning && (
        <StatusContainer>
          <Status>no preview</Status>
        </StatusContainer>
      )}
      {isRunning && <div ref={ref} className="size-full"></div>}

      <div className="flex items-center space-x-2 text-sm">
        <button
          className="flex h-6 w-full items-center justify-center space-x-2 text-gray-11 ring-inset hover:bg-sage-4 hover:text-gray-12 hover:ring-1 hover:ring-sage-9"
          onClick={() => setIsRunning((prev) => !prev)}
        >
          <span className="size-3">
            {isRunning ? <SquareIcon /> : <PlayIcon />}
          </span>
          <p>{isRunning ? 'closer' : 'preview'}</p>
        </button>
        <button
          className="flex size-6 items-center justify-center text-gray-11 ring-inset hover:bg-sage-4 hover:text-gray-12 hover:ring-1 hover:ring-sage-9"
          onClick={() => window.open(containerURL().output)}
        >
          <ExternalLinkIcon className="size-3" />
        </button>
      </div>
    </div>
  )
}
