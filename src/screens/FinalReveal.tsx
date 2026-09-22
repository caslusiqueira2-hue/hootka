// ============================================================
// hootka – FinalReveal.tsx
// Dramatic final ranking reveal shown only after the last question.
// Positions are revealed from last to first with cinematic timing.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/stores/gameStore'

// ─── Types ─────────────────────────────────────────────────────────────────

interface FinalEntry {
  rank: number
  teamName: string
  teamEmoji: string
  teamColor: string
  totalScore: number
}

// ─── Ordinal helper ────────────────────────────────────────────────────────

function ordinal(n: number): string {
  return `${n}º`
}

// ─── Individual reveal card ─────────────────────────────────────────────────

function RevealCard({ entry, visible }: { entry: FinalEntry; visible: boolean }) {
  const isFirst = entry.rank === 1

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={entry.rank}
          initial={{ opacity: 0, scale: 0.6, y: 60 }}
          animate={
            isFirst
              ? {
                  opacity: 1,
                  scale: [0.6, 1.15, 0.95, 1.05, 1],
                  y: 0,
                }
              : { opacity: 1, scale: 1, y: 0 }
          }
          exit={{ opacity: 0, scale: 0.8 }}
          transition={
            isFirst
              ? { duration: 1.0, times: [0, 0.4, 0.6, 0.8, 1] }
              : { type: 'spring', stiffness: 260, damping: 20 }
          }
          className={`relative flex items-center gap-6 border-4 border-white rounded-2xl px-8 py-6 mx-auto w-full max-w-2xl ${
            isFirst ? 'mb-8' : 'mb-4'
          }`}
          style={{
            backgroundColor: isFirst ? entry.teamColor : 'rgba(255,255,255,0.06)',
            boxShadow: isFirst
              ? `0 0 0 4px #fff, 0 0 60px ${entry.teamColor}99, 8px 8px 0 #fff`
              : '4px 4px 0 rgba(255,255,255,0.3)',
          }}
        >
          {/* Glow for 1st */}
          {isFirst && (
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                background: `radial-gradient(ellipse at center, ${entry.teamColor}66 0%, transparent 70%)`,
              }}
            />
          )}

          {/* Rank */}
          <motion.div
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className={`flex-shrink-0 font-black rounded-xl flex items-center justify-center border-4 ${
              isFirst
                ? 'text-5xl w-20 h-20 bg-black text-[#FFD700] border-black'
                : 'text-3xl w-16 h-16 bg-white/10 text-white border-white/40'
            }`}
          >
            {isFirst ? '👑' : ordinal(entry.rank)}
          </motion.div>

          {/* Emoji */}
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
            className={isFirst ? 'text-6xl' : 'text-4xl'}
          >
            {entry.teamEmoji}
          </motion.span>

          {/* Name + score */}
          <div className="flex flex-col flex-1 min-w-0">
            <motion.span
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className={`font-black uppercase tracking-wide truncate ${
                isFirst ? 'text-4xl text-black' : 'text-2xl text-white'
              }`}
            >
              {entry.teamName}
            </motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className={`font-bold tabular-nums ${
                isFirst ? 'text-2xl text-black/70' : 'text-xl text-white/70'
              }`}
            >
              {entry.totalScore.toLocaleString('pt-BR')} pts
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Loading dots ───────────────────────────────────────────────────────────

function LoadingDots() {
  return (
    <div className="flex gap-2 justify-center">
      {[0, 0.2, 0.4].map((d) => (
        <motion.div
          key={d}
          className="w-3 h-3 rounded-full bg-white"
          animate={{ opacity: [1, 0.2, 1], scale: [1, 0.7, 1] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: d }}
        />
      ))}
    </div>
  )
}

// ─── Phases ─────────────────────────────────────────────────────────────────

type Phase =
  | 'title'        // 0 – show "ÚLTIMA QUESTÃO CONCLUÍDA"
  | 'calculating'  // 1 – "Calculando..." with dots (3s)
  | 'revealing'    // 2 – progressive reveal last→first
  | 'done'         // 3 – show podium button

// ─── Main Screen ───────────────────────────────────────────────────────────

/**
 * Dramatic final reveal screen (only shown after the last question).
 * Replaces the demo `ranking` array with real gameStore data.
 */
export default function FinalReveal() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const activeTeams = useGameStore((s) => s.active.teams);
  const sorted = [...activeTeams].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const ranking: FinalEntry[] = sorted.length > 0 ? sorted.map((t, idx) => ({
    rank: idx + 1,
    teamName: t.name,
    teamEmoji: t.emoji,
    teamColor: t.color,
    totalScore: t.score ?? 0,
  })) : [
    { rank: 1, teamName: 'Raposas', teamEmoji: '🦊', teamColor: '#FFD700', totalScore: 1240 },
    { rank: 2, teamName: 'Leões', teamEmoji: '🦁', teamColor: '#FF6B6B', totalScore: 1110 },
    { rank: 3, teamName: 'Lobos', teamEmoji: '🐺', teamColor: '#4ECDC4', totalScore: 980 },
    { rank: 4, teamName: 'Tigres', teamEmoji: '🐯', teamColor: '#FFD600', totalScore: 740 },
    { rank: 5, teamName: 'Águias', teamEmoji: '🦅', teamColor: '#00C851', totalScore: 610 },
  ];

  // Reversed order for reveal (last → first)
  const revealOrder = [...ranking].reverse();

  const [phase, setPhase] = useState<Phase>('title')
  const [revealedCount, setRevealedCount] = useState(0)
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Phase transitions
  useEffect(() => {
    const t = setTimeout(() => setPhase('calculating'), 1800)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (phase !== 'calculating') return
    const t = setTimeout(() => {
      setPhase('revealing')
      setRevealedCount(1)
    }, 3000)
    return () => clearTimeout(t)
  }, [phase])

  // Auto-advance reveals every 2s
  useEffect(() => {
    if (phase !== 'revealing') return
    if (revealedCount >= revealOrder.length) {
      const t = setTimeout(() => setPhase('done'), 1500)
      return () => clearTimeout(t)
    }
    autoTimer.current = setTimeout(() => {
      setRevealedCount((c) => c + 1)
    }, 2000)
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current)
    }
  }, [phase, revealedCount, revealOrder.length])

  // Keyboard: Enter advances manually during reveal
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      if (phase === 'done') {
        navigate(`/game/${id}/podium`)
        return
      }
      if (phase === 'revealing' && revealedCount < revealOrder.length) {
        if (autoTimer.current) clearTimeout(autoTimer.current)
        setRevealedCount((c) => Math.min(c + 1, revealOrder.length))
      }
    },
    [phase, revealedCount, revealOrder.length, id, navigate]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  // Which teams are currently visible (revealed from bottom up)
  const visibleTeams = revealOrder.slice(0, revealedCount)

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Phase: title ── */}
      <AnimatePresence>
        {phase === 'title' && (
          <motion.div
            key="title"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.6 }}
            className="text-center px-8"
          >
            <motion.h1
              className="text-white font-black text-5xl md:text-7xl uppercase tracking-widest leading-tight"
              animate={{ textShadow: ['0 0 20px #fff4', '0 0 60px #fff8', '0 0 20px #fff4'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ÚLTIMA QUESTÃO
              <br />
              <span className="text-[#FFD700]">CONCLUÍDA</span>
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase: calculating ── */}
      <AnimatePresence>
        {phase === 'calculating' && (
          <motion.div
            key="calculating"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center px-8 flex flex-col items-center gap-6"
          >
            <p className="text-white/70 font-bold text-2xl uppercase tracking-widest">
              Calculando resultado final
            </p>
            <LoadingDots />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase: revealing ── */}
      <AnimatePresence>
        {(phase === 'revealing' || phase === 'done') && (
          <motion.div
            key="revealing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-3xl px-6 flex flex-col-reverse"
          >
            {/* Renders from last to first visually; revealOrder is reversed so index 0 = last place */}
            {revealOrder.map((entry) => (
              <RevealCard
                key={entry.rank}
                entry={entry}
                visible={visibleTeams.some((t) => t.rank === entry.rank)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase: done – podium button ── */}
      <AnimatePresence>
        {phase === 'done' && (
          <motion.div
            key="podium-btn"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 280 }}
            className="mt-8 px-6"
          >
            <motion.button
              onClick={() => navigate(`/game/${id}/podium`)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              className="border-4 border-[#FFD700] bg-[#FFD700] text-black font-black text-2xl uppercase tracking-widest rounded-2xl px-12 py-5"
              style={{ boxShadow: '8px 8px 0 #fff' }}
              animate={{ boxShadow: ['8px 8px 0 #fff', '8px 8px 30px #FFD70088', '8px 8px 0 #fff'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🏆 VER PÓDIO
            </motion.button>
            <p className="text-white/30 text-center mt-3 text-sm font-bold">
              ou pressione ENTER
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
