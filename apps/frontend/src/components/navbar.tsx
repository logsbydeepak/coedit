'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import {
  BoxIcon,
  CircleAlertIcon,
  LoaderIcon,
  PanelBottomCloseIcon,
  PanelBottomOpenIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  PanelsLeftRightIcon,
  RefreshCcwIcon,
  type LucideIcon,
} from 'lucide-react'
import { DropdownMenu } from 'radix-ui'

import {
  useEnvironmentStatus,
  useRestartDevbox,
  useRestartEnvironment,
  useRestartLsp,
  type EnvironmentItemState,
} from '#/app/(app)/ide/[id]/environment'
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
          <EnvironmentStatusIndicator />
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

// Separate from project status (owned by apps/orchestration, gates whether
// the IDE mounts) - this tracks devbox + per-language LSP install state
// inside an already-running container.
function EnvironmentStatusIndicator() {
  const [ideActive] = useAtom(ideActiveAtom, { store })
  const { data } = useEnvironmentStatus(ideActive)
  const restartDevbox = useRestartDevbox()
  const restartLsp = useRestartLsp()
  const restartAll = useRestartEnvironment()

  if (!ideActive) return null

  const items: { label: string; state: EnvironmentItemState }[] =
    data?.code === 'OK'
      ? [
          { label: 'devbox', state: data.devbox },
          ...Object.entries(data.languages).map(([language, state]) => ({
            label: language,
            state: state as EnvironmentItemState,
          })),
        ]
      : []

  const hasError = items.some((item) => item.state.status === 'error')
  const isInstalling = items.some((item) => item.state.status === 'installing')

  const Icon = hasError ? CircleAlertIcon : isInstalling ? LoaderIcon : BoxIcon

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        aria-label="Environment status"
        className={cn(
          'flex size-8 items-center justify-center rounded-md text-gray-11',
          'hover:bg-gray-3 hover:text-gray-12 focus-visible:ring-2 focus-visible:ring-sage-9',
          'outline-none data-[state=open]:bg-gray-3 data-[state=open]:text-gray-12',
          hasError && 'text-red-11 hover:text-red-11'
        )}
      >
        <Icon className={cn('size-4', isInstalling && 'animate-spin')} />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-30 min-w-56 rounded-md border border-gray-4 bg-gray-2 p-1',
            'drop-shadow-sm'
          )}
        >
          <div className="px-2 py-1.5 text-xs font-medium text-gray-11">
            Environment
          </div>

          {items.length === 0 ? (
            <div className="px-2 py-1.5 text-xs text-gray-10">
              Setting up...
            </div>
          ) : (
            items.map((item) => (
              <div key={item.label} className="px-2 py-1.5 text-xs">
                <div className="flex items-center justify-between space-x-2">
                  <span className="text-gray-12">{item.label}</span>
                  <EnvironmentStatusBadge status={item.state.status} />
                </div>
                {item.state.status === 'error' && (
                  <p className="mt-0.5 text-red-11">
                    Failed to set up - restart to retry
                  </p>
                )}
              </div>
            ))
          )}

          <DropdownMenu.Separator className="my-1 h-px bg-gray-4" />

          <RestartMenuItem
            label="Restart devbox"
            isPending={restartDevbox.isPending}
            onRestart={() => restartDevbox.mutate()}
          />
          <RestartMenuItem
            label="Restart lsp"
            isPending={restartLsp.isPending}
            onRestart={() => restartLsp.mutate()}
          />
          <RestartMenuItem
            label="Restart everything"
            isPending={restartAll.isPending}
            onRestart={() => restartAll.mutate()}
          />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

function RestartMenuItem({
  label,
  isPending,
  onRestart,
}: {
  label: string
  isPending: boolean
  onRestart: () => void
}) {
  return (
    <DropdownMenu.Item
      onSelect={(event) => {
        event.preventDefault()
        onRestart()
      }}
      disabled={isPending}
      className={cn(
        'flex items-center space-x-2 rounded-sm px-2 py-1.5 text-xs text-gray-11',
        'outline-none select-none data-highlighted:bg-gray-3 data-highlighted:text-gray-12',
        'hover:cursor-pointer data-disabled:pointer-events-none data-disabled:opacity-50'
      )}
    >
      <RefreshCcwIcon
        className={cn('size-2.5 shrink-0', isPending && 'animate-spin')}
      />
      <span>{label}</span>
    </DropdownMenu.Item>
  )
}

function EnvironmentStatusBadge({
  status,
}: {
  status: EnvironmentItemState['status']
}) {
  const color =
    status === 'ready'
      ? 'text-green-11'
      : status === 'error'
        ? 'text-red-11'
        : 'text-gray-10'

  return (
    <span className={cn('font-mono text-[10px] uppercase', color)}>
      {status}
    </span>
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
