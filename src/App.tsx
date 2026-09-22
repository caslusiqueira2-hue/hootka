/**
 * App.tsx — Root component
 *
 * Sets up HashRouter (required for Electron file:// protocol),
 * AnimatePresence-backed page transitions, crash-recovery modal,
 * and lazy-loaded routes for all 15+ screens.
 */

import React, { useEffect, useState, Suspense, lazy } from 'react'
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import { useSettingsStore } from '@/stores/settingsStore'
import { useGameStore } from '@/stores/gameStore'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import type { Game } from '@/types'

// ─── Lazy screen imports ──────────────────────────────────────────────────

const Auth             = lazy(() => import('@/screens/Auth'))
const Home             = lazy(() => import('@/screens/Home'))
const MyQuizzes        = lazy(() => import('@/screens/MyQuizzes'))
const CreateQuiz       = lazy(() => import('@/screens/CreateQuiz'))
const EditQuiz         = lazy(() => import('@/screens/EditQuiz'))
const ImportQuestions  = lazy(() => import('@/screens/ImportQuestions'))
const NewGame          = lazy(() => import('@/screens/NewGame'))
const GameSetup        = lazy(() => import('@/screens/GameSetup'))
const Lobby            = lazy(() => import('@/screens/Lobby'))
const QuestionScreen   = lazy(() => import('@/screens/QuestionScreen'))
const AnswerRegistration = lazy(() => import('@/screens/AnswerRegistration'))
const ScoreAnimation   = lazy(() => import('@/screens/ScoreAnimation'))
const RPGMovementScreen = lazy(() => import('@/screens/RPGMovementScreen'))
const RankingScreen    = lazy(() => import('@/screens/RankingScreen'))
const FinalReveal      = lazy(() => import('@/screens/FinalReveal'))
const Podium           = lazy(() => import('@/screens/Podium'))
const History          = lazy(() => import('@/screens/History'))
const Settings         = lazy(() => import('@/screens/Settings'))

// ─── Page transition variants ─────────────────────────────────────────────

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -16 },
}

const pageTransition = {
  duration: 0.22,
  ease: [0.4, 0, 0.2, 1] as number[],
}

// ─── Animated page wrapper ────────────────────────────────────────────────

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </motion.div>
  )
}

// ─── Loading fallback ─────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-background)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 48,
            height: 48,
            border: '4px solid var(--color-foreground)',
            borderTop: '4px solid var(--color-primary)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }}
        />
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700 }}>Carregando...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── Crash-recovery modal ─────────────────────────────────────────────────

interface RecoveryModalProps {
  game: Game
  onResume: () => void
  onDiscard: () => void
}

function RecoveryModal({ game, onResume, onDiscard }: RecoveryModalProps) {
  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <motion.div
        className="neo-card"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ maxWidth: 460, width: '100%', padding: '2rem', margin: '1rem' }}
      >
        {/* Header */}
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '2.5rem' }}>⚡</span>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: '1.5rem',
              margin: '0.5rem 0 0.25rem',
            }}
          >
            Partida interrompida!
          </h2>
          <p style={{ color: 'var(--color-muted)', margin: 0 }}>
            Uma partida de <strong>{game.quiz_name}</strong> foi interrompida. Deseja continuar de onde parou?
          </p>
        </div>

        {/* Game info chip */}
        <div
          className="neo-card-sm"
          style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem', background: 'var(--color-background)' }}
        >
          <div style={{ display: 'flex', gap: '1.5rem', fontFamily: 'var(--font-heading)', fontSize: '0.875rem' }}>
            <span>🎮 {game.mode}</span>
            <span>📋 {game.quiz_name}</span>
            <span>🔖 {game.state}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="neo-btn neo-btn-primary"
            style={{ flex: 1 }}
            onClick={onResume}
          >
            ▶ Continuar partida
          </button>
          <button
            className="neo-btn neo-btn-ghost"
            style={{ flex: 1 }}
            onClick={onDiscard}
          >
            ✕ Descartar
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Animated routes wrapper ──────────────────────────────────────────────

function AnimatedRoutes() {
  const location = useLocation()
  const { user, guestMode, loading: authLoading } = useAuthStore()

  if (authLoading) {
    return <PageLoader />
  }

  // If user is not authenticated and has not chosen guest mode, force login
  if (!user && !guestMode) {
    return (
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route
            path="/login"
            element={
              <PageWrapper>
                <Suspense fallback={<PageLoader />}>
                  <Auth />
                </Suspense>
              </PageWrapper>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* If logged in or guest, redirect /login to home */}
        <Route path="/login" element={<Navigate to="/" replace />} />

        {/* Home */}
        <Route
          path="/"
          element={
            <PageWrapper>
              <Suspense fallback={<PageLoader />}>
                <Home />
              </Suspense>
            </PageWrapper>
          }
        />

        {/* Quiz Library */}
        <Route
          path="/quizzes"
          element={
            <PageWrapper>
              <Suspense fallback={<PageLoader />}>
                <MyQuizzes />
              </Suspense>
            </PageWrapper>
          }
        />
        <Route
          path="/quiz/new"
          element={
            <PageWrapper>
              <Suspense fallback={<PageLoader />}>
                <CreateQuiz />
              </Suspense>
            </PageWrapper>
          }
        />
        <Route
          path="/quiz/:id/edit"
          element={
            <PageWrapper>
              <Suspense fallback={<PageLoader />}>
                <EditQuiz />
              </Suspense>
            </PageWrapper>
          }
        />
        <Route
          path="/quiz/:id/import"
          element={
            <PageWrapper>
              <Suspense fallback={<PageLoader />}>
                <ImportQuestions />
              </Suspense>
            </PageWrapper>
          }
        />

        {/* Game flow */}
        <Route
          path="/game/new"
          element={
            <PageWrapper>
              <Suspense fallback={<PageLoader />}>
                <NewGame />
              </Suspense>
            </PageWrapper>
          }
        />
        <Route
          path="/game/setup"
          element={
            <PageWrapper>
              <Suspense fallback={<PageLoader />}>
                <GameSetup />
              </Suspense>
            </PageWrapper>
          }
        />
        <Route
          path="/game/lobby"
          element={
            <PageWrapper>
              <Suspense fallback={<PageLoader />}>
                <Lobby />
              </Suspense>
            </PageWrapper>
          }
        />
        <Route
          path="/game/:id/question"
          element={
            <PageWrapper>
              <Suspense fallback={<PageLoader />}>
                <QuestionScreen />
              </Suspense>
            </PageWrapper>
          }
        />
        <Route
          path="/game/:id/answers"
          element={
            <PageWrapper>
              <Suspense fallback={<PageLoader />}>
                <AnswerRegistration />
              </Suspense>
            </PageWrapper>
          }
        />
        <Route
          path="/game/:id/score"
          element={
            <PageWrapper>
              <Suspense fallback={<PageLoader />}>
                <ScoreAnimation />
              </Suspense>
            </PageWrapper>
          }
        />
        <Route
          path="/game/:id/rpg-board"
          element={
            <PageWrapper>
              <Suspense fallback={<PageLoader />}>
                <RPGMovementScreen />
              </Suspense>
            </PageWrapper>
          }
        />
        <Route
          path="/game/:id/ranking"
          element={
            <PageWrapper>
              <Suspense fallback={<PageLoader />}>
                <RankingScreen />
              </Suspense>
            </PageWrapper>
          }
        />
        <Route
          path="/game/:id/final"
          element={
            <PageWrapper>
              <Suspense fallback={<PageLoader />}>
                <FinalReveal />
              </Suspense>
            </PageWrapper>
          }
        />
        <Route
          path="/game/:id/podium"
          element={
            <PageWrapper>
              <Suspense fallback={<PageLoader />}>
                <Podium />
              </Suspense>
            </PageWrapper>
          }
        />

        {/* Misc */}
        <Route
          path="/history"
          element={
            <PageWrapper>
              <Suspense fallback={<PageLoader />}>
                <History />
              </Suspense>
            </PageWrapper>
          }
        />
        <Route
          path="/settings"
          element={
            <PageWrapper>
              <Suspense fallback={<PageLoader />}>
                <Settings />
              </Suspense>
            </PageWrapper>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

// ─── App (inner, has access to router context) ────────────────────────────

function AppInner() {
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const loadGame     = useGameStore((s) => s.loadGame)
  const resetGame    = useGameStore((s) => s.resetGame)
  const initAuth     = useAuthStore((s) => s.initAuth)

  const [activeGame, setActiveGame] = useState<Game | null>(null)
  const [showRecovery, setShowRecovery] = useState(false)

  // On mount: init auth + load settings + check for crash-recoverable game
  useEffect(() => {
    let cancelled = false

    async function init() {
      // 1. Initialize Supabase Auth session & listeners
      await initAuth()

      // 2. Load app settings
      await loadSettings()

      // 3. Check for an unfinished game in the DB
      try {
        const game = await api.game.getActive()
        if (!cancelled && game && game.state !== 'finished' && game.state !== 'lobby') {
          setActiveGame(game)
          setShowRecovery(true)
        }
      } catch {
        // Non-fatal — ignore if IPC not available (e.g. browser dev mode)
      }
    }

    init()
    return () => { cancelled = true }
  }, [loadSettings, initAuth])

  const handleResume = async () => {
    if (!activeGame) return
    setShowRecovery(false)
    await loadGame(activeGame.id)
    // Navigation to the correct screen is handled by each game screen
    // via the gamePhase from the store. The game screens will redirect
    // themselves based on the restored phase.
  }

  const handleDiscard = () => {
    resetGame()
    setShowRecovery(false)
    setActiveGame(null)
  }

  return (
    <>
      {showRecovery && activeGame && (
        <RecoveryModal
          game={activeGame}
          onResume={handleResume}
          onDiscard={handleDiscard}
        />
      )}
      <AnimatedRoutes />
    </>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────

export default function App() {
  return (
    <HashRouter>
      <AppInner />
    </HashRouter>
  )
}
