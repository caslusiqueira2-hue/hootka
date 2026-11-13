import { create } from 'zustand'
import { settingsApi } from '@/lib/api'
import {
  loadHiddenWordMatch, updateHiddenWordMatch,
  type HiddenWordAction, type HiddenWordMatch,
} from '@/engine/hiddenWord'

const matchKey = 'hiddenWordMatch'

interface HiddenWordState {
  match: HiddenWordMatch | null
  loading: boolean
  loadError: boolean
  saveError: boolean
  load: () => Promise<void>
  dispatch: (action: HiddenWordAction) => boolean
  retrySave: () => void
}

let pendingSave = Promise.resolve()

export const useHiddenWordStore = create<HiddenWordState>((set, get) => {
  function save(match: HiddenWordMatch) {
    pendingSave = pendingSave.then(async () => {
      try {
        const result = await settingsApi.set(matchKey, JSON.stringify(match))
        if (!result.success) throw new Error('Falha ao salvar a partida')
        if (get().match === match) set({ saveError: false })
      } catch {
        if (get().match === match) set({ saveError: true })
      }
    })
  }

  return {
    match: null,
    loading: false,
    loadError: false,
    saveError: false,
    load: async () => {
      if (get().match || get().loading) return
      set({ loading: true, loadError: false })
      try {
        const raw = await settingsApi.get(matchKey)
        set({ match: loadHiddenWordMatch(raw) })
      } catch {
        set({ loadError: true })
      } finally {
        set({ loading: false })
      }
    },
    dispatch: (action) => {
      const current = get().match
      if (!current) return false
      const match = updateHiddenWordMatch(current, action)
      if (current === match) return false
      set({ match })
      save(match)
      return true
    },
    retrySave: () => {
      const match = get().match
      if (match) save(match)
    },
  }
})
