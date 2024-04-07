import { StateCreator } from 'zustand'

import { AppStore } from './app'

interface State {}

interface Actions {}

export type AppSlice = State & Actions

export const appSlice: StateCreator<AppStore, [], [], AppSlice> = (set) => ({})
