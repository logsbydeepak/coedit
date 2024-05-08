'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAtomValue, useSetAtom } from 'jotai'
import { FileIcon, FolderIcon, Undo2Icon } from 'lucide-react'
import { ListBox, ListBoxItem, ListBoxItemProps } from 'react-aria-components'

import { cn } from '#/utils/style'

import { editFileAtom, publicIPAtom } from '../store'
import { apiClient } from './utils'

export default function FileExplorer() {
  const setEditFile = useSetAtom(editFileAtom)
  const [currentPath, setCurrentPath] = React.useState('/')
  const disabled = React.useMemo(() => currentPath === '/', [currentPath])

  const publicIP = useAtomValue(publicIPAtom)
  const { isLoading, data, isError } = useQuery({
    queryFn: async () => {
      const res = await apiClient(publicIP).fileExplorer.$post({
        json: {
          include: [currentPath],
        },
      })
      return await res.json()
    },
    queryKey: [`file-explorer-${currentPath}`],
  })

  if (isError || !data?.result) {
    return <p>error</p>
  }

  if (isLoading) {
    return <p>loading</p>
  }

  const root = data.result[currentPath]

  if (root === 'ERROR') {
    return <p>error</p>
  }

  return (
    <div className="size-full space-y-2">
      <button
        disabled={disabled}
        onClick={() => {
          if (currentPath === '/') return
          const path = currentPath.split('/').slice(0, -1).join('/')
          setCurrentPath(path === '' ? '/' : path)
        }}
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
          move back
        </p>
      </button>
      <div className="size-full overflow-auto">
        <ListBox
          aria-label="file explorer"
          selectionMode="multiple"
          selectionBehavior="replace"
          className="w-full space-y-1"
        >
          {root.map((item) => (
            <ListBoxItem
              key={item.path}
              textValue={item.name}
              id={item.path}
              onAction={() => {
                if (item.isDirectory) {
                  setCurrentPath(item.path)
                } else {
                  setEditFile(item.path)
                }
              }}
              className={cn(
                'flex items-center px-2 py-0.5 text-sm',
                'w-full space-x-2 ring-inset',
                'aria-[selected=true]:bg-sage-4 aria-[selected=true]:ring-1',
                'overflow-hidden outline-none ring-sage-9 hover:cursor-pointer',
                'hover:bg-sage-4'
              )}
            >
              <span className="size-3.5 shrink-0">
                {item.isDirectory ? <FolderIcon /> : <FileIcon />}
              </span>

              <p className="w-full overflow-hidden text-ellipsis text-nowrap">
                {item.name}
              </p>
            </ListBoxItem>
          ))}
        </ListBox>
      </div>
    </div>
  )
}
