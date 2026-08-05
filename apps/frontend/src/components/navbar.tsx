'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import {
  PanelBottomCloseIcon,
  PanelBottomOpenIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  PanelsLeftRightIcon,
  type LucideIcon,
} from 'lucide-react'
import { DropdownMenu } from 'radix-ui'

import {
  ideActiveAtom,
  previewVisibleAtom,
  sidebarVisibleAtom,
  store,
  terminalVisibleAtom,
} from '#/app/(app)/ide/[id]/store'
import { apiClient } from '#/utils/hc-client'
import { cn } from '#/utils/style'

import { Avatar } from './avatar'
import { LogoIcon } from './icons/logo'

export function Navbar() {
  return (
    <nav className="fixed inset-x-0 z-20 border-b border-gray-4 bg-gray-2">
      <div className="mx-auto flex h-14 w-full items-center justify-between space-x-4 px-5">
        <Link
          className="flex cursor-pointer items-center justify-center space-x-1 text-sage-9"
          href="/"
        >
          <LogoIcon className="size-5" />
          <p className="text-center font-mono text-sm font-medium text-white">
            coedit
          </p>
        </Link>

        <div className="flex items-center space-x-3">
          <LayoutMenu />
          <User />
        </div>
      </div>
    </nav>
  )
}

function LayoutMenu() {
  const [ideActive] = useAtom(ideActiveAtom, { store })
  const [sidebarVisible, setSidebarVisible] = useAtom(sidebarVisibleAtom, {
    store,
  })
  const [terminalVisible, setTerminalVisible] = useAtom(terminalVisibleAtom, {
    store,
  })
  const [previewVisible, setPreviewVisible] = useAtom(previewVisibleAtom, {
    store,
  })

  if (!ideActive) return null

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        aria-label="Toggle layout"
        className={cn(
          'flex size-8 items-center justify-center rounded-md text-gray-11',
          'hover:bg-gray-3 hover:text-gray-12 focus-visible:ring-2 focus-visible:ring-sage-9',
          'outline-none data-[state=open]:bg-gray-3 data-[state=open]:text-gray-12'
        )}
      >
        <PanelsLeftRightIcon className="size-4" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-30 min-w-40 rounded-md border border-gray-4 bg-gray-2 p-1',
            'drop-shadow-sm'
          )}
        >
          <LayoutMenuItem
            checked={sidebarVisible}
            onCheckedChange={setSidebarVisible}
            openIcon={PanelLeftOpenIcon}
            closeIcon={PanelLeftCloseIcon}
          >
            Sidebar
          </LayoutMenuItem>
          <LayoutMenuItem
            checked={terminalVisible}
            onCheckedChange={setTerminalVisible}
            openIcon={PanelBottomOpenIcon}
            closeIcon={PanelBottomCloseIcon}
          >
            Terminal
          </LayoutMenuItem>
          <LayoutMenuItem
            checked={previewVisible}
            onCheckedChange={setPreviewVisible}
            openIcon={PanelRightOpenIcon}
            closeIcon={PanelRightCloseIcon}
          >
            Preview
          </LayoutMenuItem>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function LayoutMenuItem({
  checked,
  onCheckedChange,
  openIcon: OpenIcon,
  closeIcon: CloseIcon,
  children,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  openIcon: LucideIcon
  closeIcon: LucideIcon
  children: React.ReactNode
}) {
  const Icon = checked ? OpenIcon : CloseIcon

  return (
    <DropdownMenu.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      onSelect={(event) => event.preventDefault()}
      className={cn(
        'flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm text-gray-11',
        'outline-none select-none data-[highlighted]:bg-gray-3 data-[highlighted]:text-gray-12',
        'hover:cursor-pointer'
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      <span>{children}</span>
    </DropdownMenu.CheckboxItem>
  )
}

function User() {
  const { isLoading, data, isError } = useQuery({
    queryFn: async () => {
      const res = await apiClient.user.$get()
      return await res.json()
    },
    queryKey: ['user'],
    refetchOnMount: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    retry: 0,
  })

  if (isLoading) {
    return <div className="size-9 animate-pulse rounded-full bg-gray-4" />
  }

  if (!data?.name || isError) {
    return <p className="font-mono text-xs font-medium text-red-11">error</p>
  }

  return <Avatar name={data.name} className="size-9" />
}
