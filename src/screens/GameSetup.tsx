import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameStore } from '@/stores/gameStore'
import type { GameMode, GameSettings } from '@/types'

// ─── Mode Card Data ────────────────────────────────────────────────────────

interface ModeInfo {
  id: GameMode
  label: string
  description: string
  icon: string
  color: string
  available: boolean
}

const MODES: ModeInfo[] = [
  {
    id: 'classic',
    label: 'CLÁSSICO',
    description: 'Questões sequenciais, pontuação por acerto e velocidade.',
    icon: '🏆',
    color: '#FFD600',
    available: true,
  },
  {
    id: 'team',
    label: 'CORRIDA',
    description: 'Equipes disputam quem marca mais pontos no menor tempo.',
    icon: '⚡',
    color: '#1A1AFF',
    available: true,
  },
  {
    id: 'speed',
    label: 'ESTRATÉGIA',
    description: 'Apostas e poderes especiais mudam o rumo da partida.',
    icon: '🧠',
    color: '#9B59B6',
    available: false,
  },
  {
    id: 'practice',
    label: 'CAOS',
    description: 'Regras inesperadas a cada rodada. Nada é garantido!',
    icon: '🔥',
    color: '#FF3B00',
    available: false,
  },
]

// ─── Time Pills ────────────────────────────────────────────────────────────

const TIME_OPTIONS = [10, 15, 20, 30, 45, 60]

// ─── Toggle Switch ─────────────────────────────────────────────────────────

function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <div
      className="flex items-center justify-between py-3 border-b-2 border-[#0A0A0A] last:border-b-0"
      style={{ borderBottom: '2px solid #0A0A0A' }}
    >
      <span className="font-bold text-sm uppercase">{label}</span>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-14 h-7 border-2 border-[#0A0A0A] transition-colors duration-150
          ${value ? 'bg-[#00C851]' : 'bg-gray-300'}
          shadow-[3px_3px_0_#0A0A0A]`}
        style={{ border: '2px solid #0A0A0A' }}
      >
        <motion.div
          animate={{ x: value ? 28 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white border-2 border-[#0A0A0A]"
          style={{ border: '2px solid #0A0A0A' }}
        />
      </button>
    </div>
  )
}

// ─── GameSetup Screen ──────────────────────────────────────────────────────

export default function GameSetup() {
  const navigate = useNavigate()
  const location = useLocation()
  const { pendingSetup, setGameMode, updateSettings } = useGameStore()

  const quiz = pendingSetup.quiz
  const settings = pendingSetup.settings
  const [selectedMode, setSelectedMode] = useState<GameMode>(pendingSetup.mode)

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode)
    setGameMode(mode)
  }

  const handleNext = () => {
    navigate('/game/lobby')
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col">
      {/* Header */}
      <header
        className="border-b-4 border-[#0A0A0A] bg-[#1A1AFF] px-8 py-5 flex items-center gap-6"
        style={{ boxShadow: '0 4px 0 #0A0A0A' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="border-3 border-[#0A0A0A] bg-white px-4 py-2 font-black text-sm
            shadow-[4px_4px_0_#0A0A0A] hover:shadow-[2px_2px_0_#0A0A0A] hover:translate-x-[2px]
            hover:translate-y-[2px] transition-all duration-100 uppercase"
          style={{ border: '3px solid #0A0A0A' }}
        >
          ← VOLTAR
        </button>
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase text-white">
            CONFIGURAÇÃO DA PARTIDA
          </h1>
          {quiz && (
            <p className="text-blue-200 font-bold text-sm mt-0.5 uppercase">
              {quiz.name}
            </p>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Mode Selection */}
        <div className="lg:w-1/2 p-8 border-r-4 border-[#0A0A0A] overflow-y-auto" style={{ borderRight: '4px solid #0A0A0A' }}>
          <h2 className="font-black text-xl uppercase mb-6 pb-3 border-b-3 border-[#0A0A0A]" style={{ borderBottom: '3px solid #0A0A0A' }}>
            MODO DE JOGO
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {MODES.map((mode) => {
              const isSelected = selectedMode === mode.id
              return (
                <motion.button
                  key={mode.id}
                  onClick={() => mode.available && handleModeSelect(mode.id)}
                  whileTap={mode.available ? { scale: 0.97 } : {}}
                  disabled={!mode.available}
                  className={`relative p-5 border-3 border-[#0A0A0A] text-left flex flex-col gap-2
                    transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed
                    ${isSelected
                      ? 'shadow-none translate-x-1 translate-y-1'
                      : 'shadow-[6px_6px_0_#0A0A0A] hover:shadow-[3px_3px_0_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5'
                    }`}
                  style={{
                    border: '3px solid #0A0A0A',
                    backgroundColor: isSelected ? mode.color : 'white',
                  }}
                >
                  {!mode.available && (
                    <span
                      className="absolute top-2 right-2 text-xs font-black uppercase px-2 py-0.5
                        border-2 border-[#0A0A0A] bg-gray-200"
                      style={{ border: '2px solid #0A0A0A' }}
                    >
                      EM BREVE
                    </span>
                  )}
                  <span className="text-3xl">{mode.icon}</span>
                  <span className="font-black uppercase text-base">{mode.label}</span>
                  <span className="text-xs text-gray-700 font-medium leading-tight">
                    {mode.description}
                  </span>
                  {isSelected && (
                    <span className="absolute bottom-2 right-2 font-black text-xs">✓ SELECIONADO</span>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Right: Settings */}
        <div className="lg:w-1/2 p-8 overflow-y-auto">
          <h2 className="font-black text-xl uppercase mb-6 pb-3 border-b-3 border-[#0A0A0A]" style={{ borderBottom: '3px solid #0A0A0A' }}>
            CONFIGURAÇÕES
          </h2>

          {/* Time selector */}
          <div className="mb-8">
            <p className="font-black text-sm uppercase mb-3">TEMPO PADRÃO POR QUESTÃO</p>
            <div className="flex flex-wrap gap-2">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => updateSettings({ defaultTime: t })}
                  className={`px-5 py-2 border-2 border-[#0A0A0A] font-black text-sm uppercase
                    transition-all duration-100
                    ${settings.defaultTime === t
                      ? 'bg-[#FF3B00] text-white shadow-none translate-x-0.5 translate-y-0.5'
                      : 'bg-white shadow-[3px_3px_0_#0A0A0A] hover:shadow-[1px_1px_0_#0A0A0A] hover:translate-x-0.5 hover:translate-y-0.5'
                    }`}
                  style={{ border: '2px solid #0A0A0A' }}
                >
                  {t}s
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div
            className="border-3 border-[#0A0A0A] bg-white shadow-[6px_6px_0_#0A0A0A] p-5"
            style={{ border: '3px solid #0A0A0A', boxShadow: '6px 6px 0 #0A0A0A' }}
          >
            <Toggle
              label="Pontuação dinâmica"
              value={settings.dynamicScoring}
              onChange={(v) => updateSettings({ dynamicScoring: v })}
            />
            <Toggle
              label="Questões especiais"
              value={settings.specialQuestionsEnabled}
              onChange={(v) => updateSettings({ specialQuestionsEnabled: v })}
            />
            <Toggle
              label="Streak (sequência)"
              value={settings.streakEnabled}
              onChange={(v) => updateSettings({ streakEnabled: v })}
            />
            <Toggle
              label="Bônus de recuperação"
              value={settings.recoveryBonusEnabled}
              onChange={(v) => updateSettings({ recoveryBonusEnabled: v })}
            />
            <Toggle
              label="Animações"
              value={settings.animationsEnabled}
              onChange={(v) => updateSettings({ animationsEnabled: v })}
            />
            <Toggle
              label="Sons"
              value={settings.soundEnabled}
              onChange={(v) => updateSettings({ soundEnabled: v })}
            />
            <Toggle
              label="Ranking após questão"
              value={settings.showRankingAfterQuestion}
              onChange={(v) => updateSettings({ showRankingAfterQuestion: v })}
            />
          </div>
        </div>
      </div>

      {/* Footer action */}
      <footer
        className="border-t-4 border-[#0A0A0A] bg-[#F5F0E8] px-8 py-5 flex justify-end"
        style={{ borderTop: '4px solid #0A0A0A' }}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          className="px-10 py-4 border-3 border-[#0A0A0A] bg-[#00C851] font-black uppercase
            text-lg text-white shadow-[6px_6px_0_#0A0A0A] hover:shadow-[3px_3px_0_#0A0A0A]
            hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none
            active:translate-x-1.5 active:translate-y-1.5 transition-all duration-100"
          style={{ border: '3px solid #0A0A0A', boxShadow: '6px 6px 0 #0A0A0A' }}
        >
          PRÓXIMO: MONTAR EQUIPES →
        </motion.button>
      </footer>
    </div>
  )
}
