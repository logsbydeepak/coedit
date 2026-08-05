'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hc } from 'hono/client'
import { toast } from 'sonner'

import type { AppType } from '@coedit/container'

import { ResponseError } from '#/utils/error'

import { containerURL, getToken } from './store'

// Separate from project status (`['status', id]` in page.tsx, owned by
// apps/orchestration) - this tracks devbox + per-language LSP install state
// inside an already-running container.

const ENVIRONMENT_POLL_MS = 3000

// Not importing `./utils` here - it's imported from the global navbar
// (before a container URL exists), and `./utils`'s apiClient is a
// module-level singleton bound to the container URL at import time.
async function environmentFetch(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(init?.headers)
  headers.set('x-auth', getToken())

  return fetch(input, { ...init, headers }).then((res) => {
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('UNAUTHORIZED'))
    }
    if (!res.ok) {
      throw new ResponseError(res.statusText, res)
    }
    return res
  })
}

// Built lazily so it always reads the current container URL.
function environmentClient() {
  return hc<AppType>(containerURL().api, { fetch: environmentFetch })
}

async function fetchEnvironment() {
  const res = await environmentClient().environment.$get()
  return res.json()
}

async function restartEnvironment() {
  const res = await environmentClient().environment.restart.$post()
  return res.json()
}

async function restartDevbox() {
  const res = await environmentClient().environment.devbox.restart.$post()
  return res.json()
}

async function restartLsp() {
  const res = await environmentClient().environment.lsp.restart.$post()
  return res.json()
}

export type EnvironmentSnapshot = Awaited<ReturnType<typeof fetchEnvironment>>

// Mirrors utils/environment.ts's PublicEnvironmentState in apps/container.
export type EnvironmentItemState = {
  status: 'idle' | 'installing' | 'ready' | 'error'
  updatedAt: number
}

export function useEnvironmentStatus(enabled: boolean) {
  return useQuery({
    queryKey: ['environment'],
    enabled,
    queryFn: fetchEnvironment,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data || data.code !== 'OK') return ENVIRONMENT_POLL_MS

      const items: EnvironmentItemState[] = [
        data.devbox,
        ...Object.values(data.languages),
      ]
      const stillInstalling = items.some((item) => item.status === 'installing')
      return stillInstalling ? ENVIRONMENT_POLL_MS : false
    },
  })
}

function useRestartMutation(
  mutationFn: () => Promise<EnvironmentSnapshot>,
  label: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(`Restarting ${label}`)
      queryClient.invalidateQueries({ queryKey: ['environment'] })
    },
    onError: () => {
      toast.error(`Failed to restart ${label}`)
    },
  })
}

export function useRestartEnvironment() {
  return useRestartMutation(restartEnvironment, 'environment')
}

export function useRestartDevbox() {
  return useRestartMutation(restartDevbox, 'devbox')
}

export function useRestartLsp() {
  return useRestartMutation(restartLsp, 'language servers')
}
