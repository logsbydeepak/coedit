'use client'

import React from 'react'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { useAtom, useSetAtom } from 'jotai'
import ms from 'ms'

import {
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandRoot,
} from '#/components/ui/command'
import {
  DialogContent,
  DialogDescription,
  DialogRoot,
  DialogTitle,
} from '#/components/ui/dialog'

import { Status, StatusContainer } from './components'
import { editFileAtom, quickOpenAtom } from './store'
import { apiClient, getExtensionIcon } from './utils'

type File = {
  name: string
  path: string
  isDirectory: boolean
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = React.useState(value)

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debounced
}

export default function QuickOpen() {
  const [open, setOpen] = useAtom(quickOpenAtom)
  const setEditFile = useSetAtom(editFileAtom)

  const [query, setQuery] = React.useState('')
  const debouncedQuery = useDebouncedValue(query, 120)

  // Global keyboard shortcut: Ctrl/Cmd+P toggles the palette. Registered
  // once at the module's mount point rather than per-open-state so it keeps
  // working while the dialog is closed. Escape-to-close is handled by the
  // underlying radix dialog already.
  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isMod = event.metaKey || event.ctrlKey
      if (isMod && event.key.toLowerCase() === 'p') {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setOpen])

  React.useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const { data, isLoading, isError } = useQuery({
    queryFn: async () => {
      const res = await apiClient.explorer.search.$get({
        query: { query: debouncedQuery },
      })
      return await res.json()
    },
    queryKey: ['quick-open', debouncedQuery],
    enabled: open,
    staleTime: ms('4s'),
  })

  const files = data && data.code === 'OK' ? data.files : []

  function handleSelect(file: File) {
    setEditFile({ path: file.path, name: file.name })
    setOpen(false)
  }

  return (
    <DialogRoot open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="top-[20%] w-120 -translate-x-1/2 translate-y-0 p-0"
      >
        <DialogTitle className="sr-only">Quick open</DialogTitle>
        <DialogDescription className="sr-only">
          Search for a file by name. Use the up and down arrow keys to navigate
          the results and press Enter to open, or Escape to close.
        </DialogDescription>

        <CommandRoot shouldFilter={false} label="Quick open">
          <CommandInput
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Search files by name..."
          />

          <CommandList>
            {isLoading ? (
              <StatusContainer className="py-8">
                <Status isLoading>loading</Status>
              </StatusContainer>
            ) : isError || !data || data.code === 'ERROR' ? (
              <StatusContainer className="py-8">
                <Status>error</Status>
              </StatusContainer>
            ) : (
              <CommandEmpty>
                <StatusContainer className="py-8">
                  <Status>no matches</Status>
                </StatusContainer>
              </CommandEmpty>
            )}

            {files.map((file) => (
              <CommandItem
                key={file.path}
                value={file.path}
                onSelect={() => handleSelect(file)}
              >
                <Image
                  src={getExtensionIcon({
                    name: file.name,
                    isDirectory: false,
                  })}
                  alt=""
                  width="14"
                  height="14"
                  className="shrink-0"
                />

                <span className="min-w-0 shrink-0 overflow-hidden text-nowrap text-ellipsis">
                  {file.name}
                </span>
                <span className="text-gray-9 min-w-0 overflow-hidden text-xs text-nowrap text-ellipsis">
                  {file.path}
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </CommandRoot>
      </DialogContent>
    </DialogRoot>
  )
}
