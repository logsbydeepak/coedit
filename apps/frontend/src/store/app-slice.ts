import { StateCreator } from 'zustand'

import { AppStore } from './app'

type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, undefined>>
  }[Keys]

const dialogState = {
  newProject: false,
  editProject: null as string | null,
  deleteProject: null as string | null,
}

const initialState = {
  dialog: dialogState,
}

type State = typeof initialState

interface Actions {
  setDialog: <
    T extends RequireOnlyOne<{
      [key in keyof typeof dialogState]: (typeof dialogState)[key]
    }>,
  >(
    state: T
  ) => void
}

export type AppSlice = State & Actions

export const appSlice: StateCreator<AppStore, [], [], AppSlice> = (set) => ({
  ...initialState,
  setDialog: (state) => {
    set(() => ({
      dialog: {
        ...dialogState,
        ...state,
      },
    }))
  },
})
