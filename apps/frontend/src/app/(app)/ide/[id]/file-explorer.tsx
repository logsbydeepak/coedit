'use client'

import React from 'react'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { useAtomValue, useSetAtom } from 'jotai'
import { RefreshCcwIcon, Undo2Icon } from 'lucide-react'
import { ListBox, ListBoxItem } from 'react-aria-components'

import { cn } from '#/utils/style'

import { Status, StatusContainer } from './components'
import { editFileAtom, publicIPAtom } from './store'
import { apiClient, getExtensionIcon } from './utils'

type File = {
  name: string
  path: string
  isDirectory: boolean
}

export default function FileExplorer() {
  const setEditFile = useSetAtom(editFileAtom)
  const [currentPath, setCurrentPath] = React.useState('/')
  const disabled = React.useMemo(() => currentPath === '/', [currentPath])

  const publicIP = useAtomValue(publicIPAtom)
  const { isLoading, data, isError, refetch } = useQuery({
    queryFn: async () => {
      const res = await apiClient(publicIP).explorer.$post({
        json: {
          path: currentPath,
        },
      })
      return await res.json()
    },
    queryKey: [`file-explorer-${currentPath}`],
    refetchInterval: 4000,
  })

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

  function handleOnSelect(item: File) {
    if (item.isDirectory) {
      setCurrentPath(item.path)
    } else {
      setEditFile({
        path: item.path,
        name: item.name,
      })
    }
  }

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
      <div className="flex">
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

        <button
          className="flex size-6 items-center justify-center text-gray-11 ring-inset hover:bg-sage-4 hover:text-gray-12 hover:ring-1 hover:ring-sage-9"
          onClick={handleOnRefresh}
        >
          <RefreshCcwIcon className="size-3" />
        </button>
      </div>
      <div className="scrollbar size-full overflow-auto">
        {data.files.length === 0 && (
          <StatusContainer>
            <Status>empty</Status>
          </StatusContainer>
        )}

        {data.files.length !== 0 && (
          <ListBox
            aria-label="file explorer"
            selectionMode="multiple"
            selectionBehavior="replace"
            className="w-full space-y-1"
          >
            {data.files.map((item) => (
              <FileItem key={item.path} file={item} onSelect={handleOnSelect} />
            ))}
          </ListBox>
        )}
      </div>
    </div>
  )
}

function FileItem({
  file,
  onSelect,
}: {
  onSelect: (item: File) => void
  file: File
}) {
  return (
    <ListBoxItem
      textValue={file.name}
      id={file.path}
      onAction={() => onSelect(file)}
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
}
