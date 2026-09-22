// ============================================================
// hootka – Game Store (Zustand)
// ============================================================

import { create } from 'zustand'
import type {
  Quiz,
  Game,
  GameMode,
  GameSettings,
  GameQuestion,
  Team,
} from '@/types'
import { api, answerApi } from '@/lib/api'
import { calculateScore } from '@/engine/scoring'

// ─── Transient Setup State (pre-game) ─────────────────────────────────────

export interface TeamDraft {
  id: string
  name: string
  emoji: string
  color: string
  identifier: string
}

export interface PendingSetup {
  quiz: Quiz | null
  mode: GameMode
  settings: GameSettings
  teams: TeamDraft[]
}

// ─── Active Game State ────────────────────────────────────────────────────

export interface ActiveGameState {
  game: Game | null
  teams: Team[]
  questions: GameQuestion[]
  currentQuestionIndex: number
  timerRunning: boolean
  elapsedSeconds: number
  revealed: boolean
  correctTeamIds: string[]
  questionStartedAt: number | null
}

// ─── Store Shape ──────────────────────────────────────────────────────────

export interface GameStore {
  pendingSetup: PendingSetup
  setSelectedQuiz: (quiz: Quiz) => void
  setGameMode: (mode: GameMode) => void
  updateSettings: (patch: Partial<GameSettings>) => void
  setTeams: (teams: TeamDraft[]) => void
  resetSetup: () => void

  active: ActiveGameState
  setActiveGame: (game: Game, teams: Team[], questions: GameQuestion[]) => void

  startTimer: () => void
  pauseTimer: () => void
  tickTimer: () => void
  endTimer: () => void

  revealAnswer: () => void

  toggleTeamCorrect: (teamId: string) => void
  setCorrectTeams: (teamIds: string[]) => void
  registerAnswers: () => Promise<void>

  advanceQuestion: () => void
  resetActive: () => void
  resetGame: () => void
  loadGame: (id: string) => Promise<void>
}

// ─── Defaults ─────────────────────────────────────────────────────────────

const defaultSettings: GameSettings = {
  mode: 'classic',
  defaultTime: 30,
  dynamicScoring: true,
  streakEnabled: true,
  recoveryBonusEnabled: true,
  animationsEnabled: true,
  soundEnabled: true,
  showRankingAfterQuestion: true,
  specialQuestionsEnabled: true,
}

const defaultPendingSetup: PendingSetup = {
  quiz: null,
  mode: 'classic',
  settings: { ...defaultSettings },
  teams: [],
}

const defaultActive: ActiveGameState = {
  game: null,
  teams: [],
  questions: [],
  currentQuestionIndex: 0,
  timerRunning: false,
  elapsedSeconds: 0,
  revealed: false,
  correctTeamIds: [],
  questionStartedAt: null,
}

// ─── Store ────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>()((set, get) => ({
  pendingSetup: { ...defaultPendingSetup, settings: { ...defaultSettings } },
  active: { ...defaultActive },

  // ── Setup ──────────────────────────────────────────────────────────────

  setSelectedQuiz: (quiz) =>
    set((s) => ({ pendingSetup: { ...s.pendingSetup, quiz } })),

  setGameMode: (mode) =>
    set((s) => ({
      pendingSetup: {
        ...s.pendingSetup,
        mode,
        settings: { ...s.pendingSetup.settings, mode },
      },
    })),

  updateSettings: (patch) =>
    set((s) => ({
      pendingSetup: {
        ...s.pendingSetup,
        settings: { ...s.pendingSetup.settings, ...patch },
      },
    })),

  setTeams: (teams) =>
    set((s) => ({ pendingSetup: { ...s.pendingSetup, teams } })),

  resetSetup: () =>
    set(() => ({
      pendingSetup: { ...defaultPendingSetup, settings: { ...defaultSettings } },
    })),

  // ── Active Game ────────────────────────────────────────────────────────

  setActiveGame: (game, teams, questions) =>
    set(() => ({
      active: {
        ...defaultActive,
        game,
        teams,
        questions,
        currentQuestionIndex: game.current_question_index ?? 0,
      },
    })),

  loadGame: async (id: string) => {
    try {
      const g = await api.game.getById(id)
      if (g) {
        set(() => ({
          active: {
            ...defaultActive,
            game: g,
            teams: g.teams || [],
            questions: g.questions || [],
            currentQuestionIndex: g.current_question_index ?? 0,
          },
        }))
      }
    } catch (e) {
      console.error(e)
    }
  },

  // ── Timer ──────────────────────────────────────────────────────────────

  startTimer: () =>
    set((s) => ({
      active: {
        ...s.active,
        timerRunning: true,
        questionStartedAt: Date.now(),
        elapsedSeconds: 0,
        revealed: false,
        correctTeamIds: [],
      },
    })),

  pauseTimer: () =>
    set((s) => ({
      active: { ...s.active, timerRunning: !s.active.timerRunning },
    })),

  tickTimer: () =>
    set((s) => ({
      active: s.active.timerRunning
        ? { ...s.active, elapsedSeconds: s.active.elapsedSeconds + 1 }
        : s.active,
    })),

  endTimer: () =>
    set((s) => ({
      active: { ...s.active, timerRunning: false },
    })),

  // ── Reveal ────────────────────────────────────────────────────────────

  revealAnswer: () =>
    set((s) => ({
      active: { ...s.active, timerRunning: false, revealed: true },
    })),

  // ── Answer Registration ────────────────────────────────────────────────

  toggleTeamCorrect: (teamId) =>
    set((s) => {
      const ids = s.active.correctTeamIds
      return {
        active: {
          ...s.active,
          correctTeamIds: ids.includes(teamId)
            ? ids.filter((id) => id !== teamId)
            : [...ids, teamId],
        },
      }
    }),

  setCorrectTeams: (teamIds) =>
    set((s) => ({ active: { ...s.active, correctTeamIds: teamIds } })),

  registerAnswers: async () => {
    const { active } = get()
    const { game, teams, questions, currentQuestionIndex, correctTeamIds, elapsedSeconds } = active
    if (!game) return
    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return

    const settings = game.settings
    const totalTime = currentQuestion.time_seconds
    const leaderScore = Math.max(...teams.map((t) => t.score ?? 0), 0)

    const answers = teams.map((team) => {
      const correct = correctTeamIds.includes(team.id)
      const result = calculateScore({
        correct,
        basePoints: currentQuestion.base_points,
        elapsedTime: elapsedSeconds,
        totalTime,
        gapToLeader: Math.max(0, leaderScore - (team.score ?? 0)),
        streak: team.streak ?? 0,
        isSpecial: Boolean(currentQuestion.is_special),
        isWildcard: Boolean(currentQuestion.is_wildcard),
        streakEnabled: settings.streakEnabled,
        recoveryBonusEnabled: settings.recoveryBonusEnabled,
      })
      return {
        game_id: game.id,
        game_question_id: currentQuestion.id,
        team_id: team.id,
        correct,
        elapsed_time: elapsedSeconds,
        base_score: result.baseScore,
        speed_bonus: result.speedBonus,
        recovery_bonus: result.recoveryBonus,
        streak_bonus: result.streakBonus,
        special_bonus: result.specialBonus,
        total_score: result.totalScore,
      }
    })

    await answerApi.saveAnswers(answers as any)

    set((s) => ({
      active: {
        ...s.active,
        teams: s.active.teams.map((t) => {
          const correct = correctTeamIds.includes(t.id)
          const ans = answers.find((a) => a.team_id === t.id)
          return {
            ...t,
            score: (t.score ?? 0) + (ans?.total_score ?? 0),
            streak: correct ? (t.streak ?? 0) + 1 : 0,
          }
        }),
      },
    }))
  },

  // ── Navigation ────────────────────────────────────────────────────────

  advanceQuestion: () =>
    set((s) => ({
      active: {
        ...s.active,
        currentQuestionIndex: s.active.currentQuestionIndex + 1,
        timerRunning: false,
        elapsedSeconds: 0,
        revealed: false,
        correctTeamIds: [],
        questionStartedAt: null,
      },
    })),

  resetActive: () => set(() => ({ active: { ...defaultActive } })),
  resetGame: () => set(() => ({ active: { ...defaultActive } })),
}))
