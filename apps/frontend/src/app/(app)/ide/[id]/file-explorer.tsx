'use client'

import React from 'react'
import { FileTree, useFileTree, useFileTreeSearch } from '@pierre/trees/react'
import { useQuery } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { EyeIcon, EyeOffIcon, RefreshCcwIcon } from 'lucide-react'
import ms from 'ms'

import { cn } from '#/utils/style'

import { Status, StatusContainer } from './components'
import { basename, editFileAtom } from './store'
import {
  TREE_FILE_ICON_BY_EXTENSION,
  TREE_FILE_ICON_BY_FILE_NAME,
  TREE_FILE_ICON_DEFAULT,
  TREE_FILE_ICON_SPRITE_SHEET,
} from './tree-file-icons.generated'
import { apiClient } from './utils'

const useExplorerTreeQuery = () =>
  useQuery({
    queryFn: async () => {
      const res = await apiClient.explorer.tree.$get()
      return await res.json()
    },
    queryKey: ['file-explorer-tree'],
    refetchInterval: ms('4s'),
  })

function toTreePath(path: string) {
  return path.replace(/^\/+/, '')
}

function fromTreePath(path: string) {
  const withoutTrailingSlash = path.endsWith('/') ? path.slice(0, -1) : path
  return `/${withoutTrailingSlash}`
}

const DEFAULT_SEARCH_IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  'dist',
  'build',
  'target',
  '.cache',
  'out',
])

function isDefaultIgnoredForSearch(treePath: string) {
  return treePath
    .split('/')
    .filter(Boolean)
    .some((segment) => DEFAULT_SEARCH_IGNORED_DIRECTORIES.has(segment))
}

function getExpandedDirectoryPaths(
  model: ReturnType<typeof useFileTree>['model']
) {
  const count = model.getVisibleCount()
  if (count === 0) return []

  return model
    .getVisibleRows(0, count - 1)
    .filter((row) => row.kind === 'directory' && row.isExpanded)
    .map((row) => row.path)
}

const treeStyle = {
  width: '100%',
  '--trees-bg-override': 'transparent',
  '--trees-bg-muted-override': 'var(--color-sage-4)',
  '--trees-fg-override': 'var(--color-gray-12)',
  '--trees-fg-muted-override': 'var(--color-gray-11)',
  '--trees-border-color-override': 'var(--color-gray-6)',
  '--trees-selected-bg-override': 'var(--color-sage-4)',
  '--trees-selected-fg-override': 'var(--color-gray-12)',
  '--trees-selected-focused-border-color-override': 'var(--color-sage-9)',
  '--trees-focus-ring-color-override': 'var(--color-sage-9)',
  '--trees-search-bg-override': 'transparent',
  '--trees-font-family-override': 'var(--font-sans)',
  '--trees-border-radius-override': '0px',
  '--trees-padding-inline-override': '6px',
  '--trees-item-padding-x-override': '4px',
  '--trees-item-margin-x-override': '0px',
  '--trees-item-row-gap-override': '4px',
  '--trees-level-gap-override': '6px',
  '--trees-icon-width-override': '14px',
} as React.CSSProperties

const treeUnsafeCSS = `[data-file-tree-search-input] { width: 100%; }`

const toolbarButtonClassName =
  'flex size-6 shrink-0 items-center justify-center text-gray-11 ring-inset hover:bg-sage-4 hover:text-gray-12 hover:ring-1 hover:ring-sage-9'

const treeIcons = {
  set: 'none',
  colored: false,
  spriteSheet: TREE_FILE_ICON_SPRITE_SHEET,
  byFileExtension: TREE_FILE_ICON_BY_EXTENSION,
  byFileName: TREE_FILE_ICON_BY_FILE_NAME,
  remap: {
    'file-tree-icon-file': TREE_FILE_ICON_DEFAULT,
    'file-tree-icon-chevron': {
      name: 'file-tree-icon-chevron',
      width: 10,
      height: 10,
    },
  },
} as const

export default function FileExplorer() {
  const setEditFile = useSetAtom(editFileAtom)
  const { data, refetch, isRefetching, isLoading, isError } =
    useExplorerTreeQuery()

  const paths = React.useMemo(() => {
    if (!data || data.code !== 'OK') return []
    return data.paths.map(toTreePath)
  }, [data])

  const searchablePaths = React.useMemo(
    () => paths.filter((path) => !isDefaultIgnoredForSearch(path)),
    [paths]
  )

  const { model } = useFileTree({
    paths,
    density: 'compact',
    itemHeight: 22,
    icons: treeIcons,
    initialExpansion: 'closed',
    search: true,
    unsafeCSS: treeUnsafeCSS,
    onSelectionChange: (selectedPaths) => {
      if (selectedPaths.length !== 1) return

      const [selected] = selectedPaths
      if (selected.endsWith('/')) return

      const path = fromTreePath(selected)
      setEditFile({ path, name: basename(path) })
    },
  })

  const [searchIgnoredFiles, setSearchIgnoredFiles] = React.useState(false)

  const { isOpen: isSearchOpen } = useFileTreeSearch(model)
  const activePaths =
    isSearchOpen && !searchIgnoredFiles ? searchablePaths : paths

  const activePathsRef = React.useRef<readonly string[]>([])
  React.useEffect(() => {
    if (
      activePathsRef.current.length === activePaths.length &&
      activePathsRef.current.every((path, index) => path === activePaths[index])
    ) {
      return
    }

    activePathsRef.current = activePaths
    model.resetPaths(activePaths, {
      initialExpandedPaths: getExpandedDirectoryPaths(model),
    })
  }, [model, activePaths])

  function handleOnRefresh() {
    refetch()
  }

  function handleOnToggleSearchIgnoredFiles() {
    setSearchIgnoredFiles((current) => !current)
  }

  const isEmpty = !isLoading && !isError && paths.length === 0

  return (
    <div className="flex size-full flex-col">
      <div className="flex items-center space-x-1 p-1">
        <div
          className="group flex size-6 items-center justify-center"
          data-state={isRefetching}
        >
          <div className="size-2.5 rounded-full bg-gray-7 group-data-[state=false]:bg-transparent group-data-[state=true]:animate-pulse" />
        </div>

        <div className="w-full" />

        <button
          aria-pressed={searchIgnoredFiles}
          title={
            searchIgnoredFiles
              ? 'Including node_modules, .git, dist, etc. in search — click to hide them again'
              : 'Hiding node_modules, .git, dist, etc. from search — click to include them'
          }
          className={cn(
            toolbarButtonClassName,
            searchIgnoredFiles && 'bg-sage-4 text-gray-12'
          )}
          onClick={handleOnToggleSearchIgnoredFiles}
        >
          {searchIgnoredFiles ? (
            <EyeIcon className="size-3" />
          ) : (
            <EyeOffIcon className="size-3" />
          )}
        </button>

        <button className={toolbarButtonClassName} onClick={handleOnRefresh}>
          <RefreshCcwIcon className="size-3" />
        </button>
      </div>

      {isLoading ? (
        <StatusContainer>
          <Status isLoading>loading</Status>
        </StatusContainer>
      ) : isError || !data || data.code === 'ERROR' ? (
        <StatusContainer>
          <Status>error</Status>
        </StatusContainer>
      ) : isEmpty ? (
        <StatusContainer>
          <Status>empty</Status>
        </StatusContainer>
      ) : (
        <FileTree model={model} className="min-h-0 flex-1" style={treeStyle} />
      )}
    </div>
  )
}
