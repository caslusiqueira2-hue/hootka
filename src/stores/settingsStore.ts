/**
 * settingsStore — Zustand store for app-wide settings.
 *
 * Settings are persisted in the SQLite database via the IPC settings API.
 * On first launch the database seeds defaults (see electron/database.ts).
 */

import { create } from 'zustand'
import api from '@/lib/api'
import type { GameSettings } from '@/types'

// ─── State & Actions ──────────────────────────────────────────────────────

interface SettingsState extends GameSettings {
  loading: boolean
  error: string | null

  // Actions
  loadSettings: () => Promise<void>
  updateSetting: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => Promise<void>
  saveSettings: (settings: Partial<GameSettings>) => Promise<void>
}

// ─── Defaults ─────────────────────────────────────────────────────────────

const DEFAULTS: GameSettings = {
  soundEnabled: true,
  animationsEnabled: true,
  dynamicScoring: true,
  streakEnabled: true,
  recoveryBonusEnabled: true,
  showRankingAfterQuestion: true,
  specialQuestionsEnabled: true,
  defaultQuestionTime: 30,
}

// ─── Helper: parse raw DB settings map ───────────────────────────────────

function parseRaw(raw: Record<string, string>): GameSettings {
  return {
    soundEnabled: raw.soundEnabled !== 'false',
    animationsEnabled: raw.animationsEnabled !== 'false',
    dynamicScoring: raw.dynamicScoring !== 'false',
    streakEnabled: raw.streakEnabled !== 'false',
    recoveryBonusEnabled: raw.recoveryBonusEnabled !== 'false',
    showRankingAfterQuestion: raw.showRankingAfterQuestion !== 'false',
    specialQuestionsEnabled: raw.specialQuestionsEnabled !== 'false',
    defaultQuestionTime: raw.defaultQuestionTime
      ? parseInt(raw.defaultQuestionTime, 10)
      : DEFAULTS.defaultQuestionTime,
  }
}

// ─── Store ────────────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial state (defaults — overwritten by loadSettings)
  ...DEFAULTS,
  loading: false,
  error: null,

  // ── loadSettings ────────────────────────────────────────────────────────
  loadSettings: async () => {
    set({ loading: true, error: null })
    try {
      const raw = await api.settings.getAll()
      const parsed = parseRaw(raw)
      set({ ...parsed, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load settings'
      set({ loading: false, error: message })
    }
  },

  // ── updateSetting ───────────────────────────────────────────────────────
  updateSetting: async <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    // Optimistic local update
    set({ [key]: value } as Partial<SettingsState>)
    try {
      await api.settings.set(key, String(value))
    } catch (err) {
      // Rollback on failure
      const prev = get()
      set({ [key]: prev[key] } as Partial<SettingsState>)
      console.error('Failed to persist setting', key, err)
    }
  },

  // ── saveSettings ────────────────────────────────────────────────────────
  saveSettings: async (settings: Partial<GameSettings>) => {
    set({ ...settings } as Partial<SettingsState>)
    try {
      await Promise.all(
        (Object.entries(settings) as [keyof GameSettings, GameSettings[keyof GameSettings]][]).map(
          ([k, v]) => api.settings.set(k, String(v))
        )
      )
    } catch (err) {
      console.error('Failed to save settings', err)
    }
  },
}))

// ─── Convenience selector ─────────────────────────────────────────────────

export function selectGameSettings(s: SettingsState): GameSettings {
  return {
    soundEnabled: s.soundEnabled,
    animationsEnabled: s.animationsEnabled,
    dynamicScoring: s.dynamicScoring,
    streakEnabled: s.streakEnabled,
    recoveryBonusEnabled: s.recoveryBonusEnabled,
    showRankingAfterQuestion: s.showRankingAfterQuestion,
    specialQuestionsEnabled: s.specialQuestionsEnabled,
    defaultQuestionTime: s.defaultQuestionTime,
  }
}
