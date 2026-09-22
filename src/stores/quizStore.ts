/**
 * quizStore — Zustand store for the quiz library.
 *
 * Manages CRUD operations for quizzes and their questions.
 * All persistence goes through the IPC API.
 */

import { create } from 'zustand'
import api from '@/lib/api'
import type { Quiz, Question } from '@/types'

// ─── State & Actions ──────────────────────────────────────────────────────

interface QuizState {
  quizzes: Quiz[]
  loading: boolean
  error: string | null

  // Actions
  loadQuizzes: () => Promise<void>
  createQuiz: (data: Omit<Quiz, 'id' | 'created_at' | 'updated_at'>) => Promise<string>
  updateQuiz: (id: string, data: Partial<Quiz>) => Promise<void>
  deleteQuiz: (id: string) => Promise<void>
  duplicateQuiz: (id: string) => Promise<string>
  getQuizWithQuestions: (id: string) => Promise<(Quiz & { questions: Question[] }) | null>
}

// ─── Store ────────────────────────────────────────────────────────────────

export const useQuizStore = create<QuizState>((set, get) => ({
  quizzes: [],
  loading: false,
  error: null,

  // ── loadQuizzes ─────────────────────────────────────────────────────────
  loadQuizzes: async () => {
    set({ loading: true, error: null })
    try {
      const quizzes = await api.quiz.getAll()
      set({ quizzes, loading: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load quizzes'
      set({ loading: false, error: message })
    }
  },

  // ── createQuiz ──────────────────────────────────────────────────────────
  createQuiz: async (data) => {
    set({ loading: true, error: null })
    try {
      const { id } = await api.quiz.create(data)
      // Reload the full list to get the server-stamped record
      await get().loadQuizzes()
      return id
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create quiz'
      set({ loading: false, error: message })
      throw err
    }
  },

  // ── updateQuiz ──────────────────────────────────────────────────────────
  updateQuiz: async (id, data) => {
    // Optimistic update
    set((s) => ({
      quizzes: s.quizzes.map((q) => (q.id === id ? { ...q, ...data } : q)),
    }))
    try {
      await api.quiz.update(id, data)
    } catch (err) {
      // Rollback
      await get().loadQuizzes()
      throw err
    }
  },

  // ── deleteQuiz ──────────────────────────────────────────────────────────
  deleteQuiz: async (id) => {
    // Optimistic removal
    const prev = get().quizzes
    set((s) => ({ quizzes: s.quizzes.filter((q) => q.id !== id) }))
    try {
      await api.quiz.delete(id)
    } catch (err) {
      // Rollback
      set({ quizzes: prev })
      throw err
    }
  },

  // ── duplicateQuiz ───────────────────────────────────────────────────────
  duplicateQuiz: async (id) => {
    set({ loading: true, error: null })
    try {
      const { id: newId } = await api.quiz.duplicate(id)
      await get().loadQuizzes()
      return newId
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to duplicate quiz'
      set({ loading: false, error: message })
      throw err
    }
  },

  // ── getQuizWithQuestions ────────────────────────────────────────────────
  getQuizWithQuestions: async (id) => {
    try {
      const quiz = await api.quiz.getById(id)
      if (!quiz) return null
      const questions = await api.question.getByQuiz(id)
      return { ...quiz, questions }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load quiz'
      set({ error: message })
      return null
    }
  },
}))
