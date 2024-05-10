'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAtomValue, useSetAtom } from 'jotai'
import { LoaderIcon, RefreshCcwIcon, Undo2Icon } from 'lucide-react'
import { ListBox, ListBoxItem } from 'react-aria-components'

import { cn } from '#/utils/style'

import { editFileAtom, publicIPAtom } from '../store'
import { getExtensionIcon } from './extension'
import { apiClient } from './utils'

export default function FileExplorer() {
  const setEditFile = useSetAtom(editFileAtom)
  const [currentPath, setCurrentPath] = React.useState('/')
  const disabled = React.useMemo(() => currentPath === '/', [currentPath])

  const publicIP = useAtomValue(publicIPAtom)
  const { isLoading, data, isError, refetch } = useQuery({
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

  if (isLoading) {
    return (
      <Container>
        <Status isLoading>loading</Status>
      </Container>
    )
  }

  if (isError || !data?.result) {
    return (
      <Container>
        <Status>error</Status>
      </Container>
    )
  }

  const root = data.result[currentPath]
  if (root === 'ERROR') {
    return (
      <Container>
        <Status>error</Status>
      </Container>
    )
  }

  return (
    <div className="size-full space-y-2">
      <div className="flex">
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
            back
          </p>
        </button>

        <button
          className="flex size-6 items-center justify-center text-gray-11 ring-inset hover:bg-sage-4 hover:text-gray-12 hover:ring-1 hover:ring-sage-9"
          onClick={() => refetch()}
        >
          <RefreshCcwIcon className="size-3" />
        </button>
      </div>
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
                  setEditFile({
                    path: item.path,
                    name: item.name,
                  })
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
              <span className="size-3 shrink-0">
                {/* eslint-disable @next/next/no-img-element */}
                <img
                  src={getExtensionIcon({
                    name: item.name,
                    isDirectory: item.isDirectory,
                  })}
                  alt={item.name}
                  className="size-3.5"
                />
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
