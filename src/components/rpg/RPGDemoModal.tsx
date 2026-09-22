import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NeoBrutalistModal from '@/components/ui/NeoBrutalistModal';
import NeoBrutalistButton from '@/components/ui/NeoBrutalistButton';
import NeoBrutalistCard from '@/components/ui/NeoBrutalistCard';
import NeoBrutalistBadge from '@/components/ui/NeoBrutalistBadge';
import { RPGBoard } from './RPGBoard';
import { OvertakeBanner } from './OvertakeBanner';
import { XPToMovementAnimation } from './XPToMovementAnimation';
import { RPGBossModal } from './RPGBossModal';
import {
  FOREST_OF_KNOWLEDGE_MAP,
  createInitialTeamState,
  calculateMovement,
  resolveTileLanding,
  detectBoardOvertakes,
  checkVictory,
  calculateCampaignTitle,
} from '@/engine/rpgEngine';
import type { Team, RPGTeamState, OvertakeEvent } from '@/types';
import soundEngine from '@/utils/soundEngine';

interface RPGDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_DEMO_TEAMS: Team[] = [
  { id: 'dt-1', name: 'Guerreiros da Lógica', emoji: '🦁', color: '#FFD600', score: 0, streak: 0, position: 1, previousPosition: 1 },
  { id: 'dt-2', name: 'Magos do Código', emoji: '🧙‍♂️', color: '#1A1AFF', score: 0, streak: 0, position: 2, previousPosition: 2 },
  { id: 'dt-3', name: 'Arqueiros do Saber', emoji: '🏹', color: '#00C851', score: 0, streak: 0, position: 3, previousPosition: 3 },
  { id: 'dt-4', name: 'Alquimistas da Ciência', emoji: '🧪', color: '#FF6D00', score: 0, streak: 0, position: 4, previousPosition: 4 },
  { id: 'dt-5', name: 'Guardiões do Saber', emoji: '🛡️', color: '#9B59B6', score: 0, streak: 0, position: 5, previousPosition: 5 },
];

const DEMO_QUESTIONS = [
  { q: 'Qual é o resultado de 12 × 15?', subject: 'Matemática', bonusXp: 120 },
  { q: 'Qual elemento tem o símbolo químico Au?', subject: 'Química', bonusXp: 150 },
  { q: 'Em que ano o Homem pisou na Lua pela 1ª vez?', subject: 'História', bonusXp: 140 },
  { q: 'Qual estrutura de dados opera como LIFO (Last In First Out)?', subject: 'Computação', bonusXp: 180 },
  { q: 'Qual é a maior floresta tropical do planeta?', subject: 'Geografia', bonusXp: 160 },
  { q: 'DESAFIO DO CHEFÃO: Qual constante matemática representa a razão entre perímetro e diâmetro?', subject: 'Elite Boss', bonusXp: 300 },
  { q: 'Quem formulou a Teoria da Relatividade Geral?', subject: 'Física', bonusXp: 200 },
  { q: 'Grande Final: Quantos bits formam exatamente 1 Byte?', subject: 'Desafio Final', bonusXp: 250 },
];

export const RPGDemoModal: React.FC<RPGDemoModalProps> = ({ isOpen, onClose }) => {
  const [teams, setTeams] = useState<Team[]>(INITIAL_DEMO_TEAMS);
  const [teamStates, setTeamStates] = useState<Record<string, RPGTeamState>>({});
  const [currentRound, setCurrentRound] = useState(0);
  const [overtakes, setOvertakes] = useState<OvertakeEvent[]>([]);
  const [lastRoundScores, setLastRoundScores] = useState<Record<string, any>>({});
  const [showBossModal, setShowBossModal] = useState(false);
  const [winner, setWinner] = useState<Team | null>(null);
  const [winReason, setWinReason] = useState<string>('');
  const [logMessages, setLogMessages] = useState<string[]>([]);

  // Initialize demo on open
  useEffect(() => {
    if (isOpen) {
      resetDemo();
    }
  }, [isOpen]);

  const resetDemo = () => {
    const states: Record<string, RPGTeamState> = {};
    INITIAL_DEMO_TEAMS.forEach((t) => {
      states[t.id] = createInitialTeamState(t.id);
    });
    setTeams(INITIAL_DEMO_TEAMS.map((t) => ({ ...t, score: 0, streak: 0, position: 1, previousPosition: 1 })));
    setTeamStates(states);
    setCurrentRound(0);
    setOvertakes([]);
    setLastRoundScores({});
    setShowBossModal(false);
    setWinner(null);
    setWinReason('');
    setLogMessages(['Partida de demonstração iniciada! 5 equipes no Acampamento Inicial.']);
  };

  const advanceOneRound = () => {
    if (winner || currentRound >= DEMO_QUESTIONS.length) return;

    soundEngine.playCorrect();
    const qInfo = DEMO_QUESTIONS[currentRound] || { q: 'Pergunta Geral', subject: 'Geral', bonusXp: 150 };
    const roundScores: Record<string, any> = {};

    // Simulate performance with pedagogical dynamics (comeback opportunities, accuracy)
    const updatedTeams = teams.map((team) => {
      const isBossQuestion = currentRound === 5;
      const isCorrect = Math.random() > (isBossQuestion ? 0.35 : 0.25);
      const teamStreak = team.streak || 0;

      let xp = 0;
      if (isCorrect) {
        const speedBonus = Math.floor(Math.random() * 40);
        const streakBonus = teamStreak * 15;
        xp = qInfo.bonusXp + speedBonus + streakBonus;
      }

      roundScores[team.id] = {
        totalScore: xp,
        correct: isCorrect,
      };

      const newScore = (team.score ?? 0) + xp;
      const newStreak = isCorrect ? teamStreak + 1 : 0;
      return {
        ...team,
        score: newScore,
        streak: newStreak,
        previousPosition: team.position,
      };
    });

    // Process movements and tile landing
    const updatedStates: Record<string, RPGTeamState> = { ...teamStates };
    const newLogs: string[] = [];

    updatedTeams.forEach((team) => {
      const breakdown = roundScores[team.id];
      const currentState = updatedStates[team.id];

      const { movement } = calculateMovement(breakdown.totalScore, false);
      const targetTileIndex = Math.min(
        currentState.currentTileIndex + movement,
        FOREST_OF_KNOWLEDGE_MAP.tiles.length - 1
      );
      const targetTile = FOREST_OF_KNOWLEDGE_MAP.tiles[targetTileIndex];
      const resolution = resolveTileLanding(targetTile);

      const finalTileIndex = Math.min(
        targetTileIndex + resolution.bonusMovement,
        FOREST_OF_KNOWLEDGE_MAP.tiles.length - 1
      );

      updatedStates[team.id] = {
        ...currentState,
        currentTileIndex: finalTileIndex,
        pathHistory: [...currentState.pathHistory, finalTileIndex],
        xp: currentState.xp + breakdown.totalScore + resolution.bonusXp,
        totalMovement: currentState.totalMovement + movement + resolution.bonusMovement,
        correctAnswers: currentState.correctAnswers + (breakdown.correct ? 1 : 0),
        wrongAnswers: currentState.wrongAnswers + (!breakdown.correct ? 1 : 0),
        streak: breakdown.correct ? currentState.streak + 1 : 0,
        maxStreak: Math.max(currentState.maxStreak, breakdown.correct ? currentState.streak + 1 : 0),
      };

      if (movement > 0) {
        newLogs.push(`${team.emoji} ${team.name}: +${breakdown.totalScore} XP ➔ avançou para Casa ${finalTileIndex} (${targetTile.label})`);
      }
    });

    // Detect overtakes
    const newOvertakes = detectBoardOvertakes(updatedTeams, updatedStates);
    if (newOvertakes.length > 0) {
      soundEngine.playOvertake();
      newOvertakes.forEach((ov) => {
        newLogs.push(`⚡ ULTRAPASSAGEM: ${ov.team.emoji} ${ov.team.name} subiu para ${ov.toPosition}º lugar!`);
      });
    }

    // Update positions
    const sorted = [...updatedTeams].sort((a, b) => {
      const stateA = updatedStates[a.id]?.currentTileIndex ?? 0;
      const stateB = updatedStates[b.id]?.currentTileIndex ?? 0;
      if (stateB !== stateA) return stateB - stateA;
      return (b.score ?? 0) - (a.score ?? 0);
    });

    sorted.forEach((team, rankIdx) => {
      team.position = rankIdx + 1;
    });

    // Check boss tile encounter
    const steppedOnBoss = Object.values(updatedStates).some((s) => s.currentTileIndex === 24);
    if (steppedOnBoss && currentRound < 5) {
      setShowBossModal(true);
    }

    // Check victory
    const nextRound = currentRound + 1;
    const isLast = nextRound >= DEMO_QUESTIONS.length;
    const vic = checkVictory(
      sorted,
      updatedStates,
      FOREST_OF_KNOWLEDGE_MAP,
      { rpgVictoryCondition: 'hybrid', minXpForVictory: 600 },
      isLast
    );

    setTeams(sorted);
    setTeamStates(updatedStates);
    setOvertakes(newOvertakes);
    setLastRoundScores(roundScores);
    setCurrentRound(nextRound);
    setLogMessages((prev) => [...newLogs.slice(0, 3), ...prev].slice(0, 10));

    if (vic.isOver && vic.winner) {
      setWinner(vic.winner);
      setWinReason(vic.reason || 'Conquistou o Trono do Conhecimento!');
      soundEngine.playVictory();
    }
  };

  const simulateToEnd = () => {
    let r = currentRound;
    while (r < DEMO_QUESTIONS.length && !winner) {
      advanceOneRound();
      r++;
    }
  };

  return (
    <NeoBrutalistModal
      isOpen={isOpen}
      onClose={onClose}
      title="🎮 SIMULADOR INTERATIVO: MODO RPG (DEMO 1-CLIQUE)"
      size="xl"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Controls Header */}
        <div
          style={{
            background: '#FFD600',
            border: '3px solid #0A0A0A',
            boxShadow: '4px 4px 0 #0A0A0A',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.6rem' }}>🗺️</span>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.25rem' }}>
                RODADA {Math.min(currentRound + 1, DEMO_QUESTIONS.length)} DE {DEMO_QUESTIONS.length}
              </h3>
              <NeoBrutalistBadge variant="primary">
                FLORESTA DO SABER
              </NeoBrutalistBadge>
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', fontWeight: 700, color: '#333' }}>
              {currentRound < DEMO_QUESTIONS.length
                ? `Questão Atual (${DEMO_QUESTIONS[currentRound].subject}): "${DEMO_QUESTIONS[currentRound].q}"`
                : 'Fim da Simulação da Campanha!'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {!winner && currentRound < DEMO_QUESTIONS.length && (
              <>
                <NeoBrutalistButton variant="primary" size="md" onClick={advanceOneRound}>
                  RODADA SEGUINTE 🎲
                </NeoBrutalistButton>
                <NeoBrutalistButton variant="secondary" size="md" onClick={simulateToEnd}>
                  SIMULAR ATÉ O FIM ⚡
                </NeoBrutalistButton>
              </>
            )}
            <NeoBrutalistButton variant="ghost" size="md" onClick={resetDemo}>
              REINICIAR 🔄
            </NeoBrutalistButton>
          </div>
        </div>

        {/* Overtake Alerts */}
        <OvertakeBanner overtakes={overtakes} onDismiss={() => setOvertakes([])} />

        {/* Winner Callout */}
        <AnimatePresence>
          {winner && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                background: '#00C851',
                color: '#FFFFFF',
                border: '4px solid #0A0A0A',
                boxShadow: '6px 6px 0 #0A0A0A',
                padding: '1.25rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '3rem' }}>👑</span>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 900,
                  fontSize: '1.8rem',
                  margin: '0.25rem 0',
                  textTransform: 'uppercase',
                }}
              >
                VITÓRIA ÉPICA: {winner.emoji} {winner.name}!
              </h2>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>
                {winReason} Total: <strong>{winner.score} XP</strong> acumulados com puro mérito pedagógico!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The RPG Board */}
        <RPGBoard
          map={FOREST_OF_KNOWLEDGE_MAP}
          teams={teams}
          teamStates={teamStates}
        />

        {/* Round Scores & Movement Feed */}
        {Object.keys(lastRoundScores).length > 0 && (
          <XPToMovementAnimation
            teams={teams}
            teamStates={teamStates}
            roundScores={lastRoundScores}
          />
        )}

        {/* Live Simulation Log */}
        <div
          style={{
            background: '#FFFFFF',
            border: '3px solid #0A0A0A',
            boxShadow: '4px 4px 0 #0A0A0A',
            padding: '0.75rem 1rem',
          }}
        >
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            📜 DIÁRIO DE AVANÇO EM TEMPO REAL:
          </div>
          <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {logMessages.map((msg, i) => (
              <div key={i} style={{ fontSize: '0.82rem', fontWeight: 700, color: '#333' }}>
                • {msg}
              </div>
            ))}
          </div>
        </div>

        {/* Boss Encounter Modal */}
        <RPGBossModal
          isOpen={showBossModal}
          onClose={() => setShowBossModal(false)}
          onProceed={() => {
            setShowBossModal(false);
            advanceOneRound();
          }}
        />

        {/* Close Button Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <NeoBrutalistButton variant="ghost" size="md" onClick={onClose}>
            FECHAR SIMULADOR ✕
          </NeoBrutalistButton>
        </div>
      </div>
    </NeoBrutalistModal>
  );
};

export default RPGDemoModal;
