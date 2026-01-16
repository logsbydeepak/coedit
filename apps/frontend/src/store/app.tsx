'use client'

import React, { createContext } from 'react'
import { createStore, StateCreator, useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

import { AppSlice, appSlice } from './app-slice'

export type AppStore = AppSlice

const appStore: StateCreator<AppStore> = (...args) => ({
  ...appSlice(...args),
})

const createAppStore = (initialProps?: Partial<AppStore>) => {
  return createStore<AppStore>((...args) => ({
    ...appStore(...args),
    ...initialProps,
  }))
}

type CreateAppStoreType = ReturnType<typeof createAppStore>
const AppContext = createContext<CreateAppStoreType | null>(null)

export function AppProvider({
  children,
  initialProps,
}: {
  children: React.ReactNode
  initialProps?: Partial<AppStore>
}) {
  const [store] = React.useState(() => createAppStore(initialProps))
  return <AppContext.Provider value={store}>{children}</AppContext.Provider>
}

export function useAppStore<T>(selector: (state: AppStore) => T): T {
  const store = React.useContext(AppContext)
  if (!store) throw new Error('Missing AppContext.Provider in the tree')
  return useStore(store, useShallow(selector))
}
