'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAtomValue, useSetAtom } from 'jotai'
import { FileIcon, FolderIcon } from 'lucide-react'
import { ListBox, ListBoxItem } from 'react-aria-components'

import { cn } from '#/utils/style'

import { editFileAtom, publicIPAtom } from '../store'
import { apiClient } from './utils'

export default function FileExplorer() {
  const setEditFile = useSetAtom(editFileAtom)

  const publicIP = useAtomValue(publicIPAtom)
  const { isLoading, data, isError } = useQuery({
    queryFn: async () => {
      const res = await apiClient(publicIP).fileExplorer.$post({
        json: {
          include: ['/', '/app', '/test'],
        },
      })
      return await res.json()
    },
    queryKey: ['file-explorer'],
  })

  if (isError || !data?.result) {
    return <p>error</p>
  }

  if (isLoading) {
    return <p>loading</p>
  }

  const root = data.result['/']

  if (root === 'ERROR') {
    return <p>error</p>
  }

  return (
    <>
      <ListBox
        aria-label="file explorer"
        selectionMode="multiple"
        selectionBehavior="replace"
        className="w-full space-y-1"
      >
        {root.map((item, idx) => (
          <ListBoxItem
            key={item.path}
            textValue={item.name}
            id={item.path}
            onAction={() => setEditFile(item.path)}
            className={cn(
              'flex items-center px-2 py-0.5 text-sm',
              'w-full space-x-2 ring-inset',
              'aria-[selected=true]:bg-sage-4 aria-[selected=true]:ring-1',
              'overflow-hidden outline-none ring-sage-9 hover:cursor-pointer'
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
    </>
  )
}
