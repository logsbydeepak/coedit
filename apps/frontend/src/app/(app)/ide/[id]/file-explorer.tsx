'use client'

import React from 'react'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { RefreshCcwIcon, SlashIcon, Undo2Icon } from 'lucide-react'
import { ListBox, ListBoxItem } from 'react-aria-components'

import { cn } from '#/utils/style'

import { Status, StatusContainer } from './components'
import { editFileAtom } from './store'
import { apiClient, getExtensionIcon } from './utils'

type File = {
  name: string
  path: string
  isDirectory: boolean
}

const useExplorerQuery = (path: string) =>
  useQuery({
    queryFn: async () => {
      const res = await apiClient.explorer.$post({
        json: {
          path: path,
        },
      })
      return await res.json()
    },
    queryKey: [`file-explorer-${path}`],
    refetchInterval: 4000,
  })

export default function FileExplorer() {
  const [currentPath, setCurrentPath] = React.useState('/')
  const disabled = React.useMemo(() => currentPath === '/', [currentPath])

  const { refetch, isRefetching } = useExplorerQuery(currentPath)

  function handleOnRefresh() {
    refetch()
  }

  function handleOnBack() {
    if (currentPath === '/') return
    const path = currentPath.split('/').slice(0, -1).join('/')
    setCurrentPath(path === '' ? '/' : path)
  }

  return (
    <div className="flex size-full flex-col space-y-2">
      <div className="flex space-x-2">
        <button
          disabled={disabled}
          onClick={handleOnBack}
          className={cn(
            'flex items-center space-x-2 px-2 py-1',
            'w-full ring-inset disabled:opacity-50',
            'hover:bg-sage-4 hover:ring-1 hover:ring-sage-9'
          )}
        >
          <span className="size-3.5 shrink-0">
            <Undo2Icon />
          </span>
          <p className="w-full overflow-hidden text-ellipsis text-nowrap text-left text-xs">
            back
          </p>
        </button>

        <div
          className="group flex size-6 items-center justify-center"
          data-state={isRefetching}
        >
          <div className="size-3 rounded-full bg-gray-7 group-data-[state=false]:hidden group-data-[state=true]:animate-pulse" />
        </div>

        <button
          className="flex size-6 shrink-0 items-center justify-center text-gray-11 ring-inset hover:bg-sage-4 hover:text-gray-12 hover:ring-1 hover:ring-sage-9"
          onClick={() => setCurrentPath('/')}
        >
          <SlashIcon className="size-3" />
        </button>

        <button
          className="flex size-6 shrink-0 items-center justify-center text-gray-11 ring-inset hover:bg-sage-4 hover:text-gray-12 hover:ring-1 hover:ring-sage-9"
          onClick={handleOnRefresh}
        >
          <RefreshCcwIcon className="size-3" />
        </button>
      </div>

      <Explorer
        currentPath={currentPath}
        onChangePath={(path) => setCurrentPath(path)}
      />
    </div>
  )
}

function Explorer({
  currentPath,
  onChangePath,
}: {
  currentPath: string
  onChangePath: (path: string) => void
}) {
  const setEditFile = useSetAtom(editFileAtom)

  const { isLoading, data, isError } = useExplorerQuery(currentPath)

  function handleOnSelect(item: File) {
    if (item.isDirectory) {
      onChangePath(item.path)
    } else {
      setEditFile({
        path: item.path,
        name: item.name,
      })
    }
  }

  if (isLoading) {
    return (
      <StatusContainer>
        <Status isLoading>loading</Status>
      </StatusContainer>
    )
  }

  if (isError || !data || data.code === 'ERROR') {
    return (
      <StatusContainer>
        <Status>error</Status>
      </StatusContainer>
    )
  }

  return (
    <ListBox
      items={data.files}
      aria-label="file explorer"
      selectionMode="multiple"
      selectionBehavior="replace"
      className="scrollbar size-full space-y-1 overflow-auto"
      renderEmptyState={() => (
        <StatusContainer>
          <Status>empty</Status>
        </StatusContainer>
      )}
    >
      {(item: File) => (
        <FileItem
          id={item.path}
          file={item}
          onAction={() => handleOnSelect(item)}
        />
      )}
    </ListBox>
  )
}

const FileItem = React.forwardRef<
  React.ElementRef<typeof ListBoxItem>,
  React.ComponentPropsWithoutRef<typeof ListBoxItem> & { file: File }
>(({ file, ...props }, ref) => {
  return (
    <ListBoxItem
      {...props}
      ref={ref}
      textValue={file.path}
      className={cn(
        'flex items-center px-2 py-0.5 text-sm',
        'w-full space-x-2 ring-inset',
        'aria-[selected=true]:bg-sage-4 aria-[selected=true]:ring-1',
        'overflow-hidden outline-none ring-sage-9 hover:cursor-pointer',
        'hover:bg-sage-4'
      )}
    >
      <Image
        src={getExtensionIcon({
          name: file.name,
          isDirectory: file.isDirectory,
        })}
        alt={file.name}
        width="14"
        height="14"
      />

      <p className="w-full overflow-hidden text-ellipsis text-nowrap text-sm">
        {file.name}
      </p>
    </ListBoxItem>
  )
})
FileItem.displayName = 'FileItem'
