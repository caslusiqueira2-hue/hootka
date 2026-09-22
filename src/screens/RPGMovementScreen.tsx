import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { useRPGStore } from '@/stores/rpgStore';
import soundEngine from '@/utils/soundEngine';
import NeoBrutalistButton from '@/components/ui/NeoBrutalistButton';
import NeoBrutalistBadge from '@/components/ui/NeoBrutalistBadge';
import { RPGBoard } from '@/components/rpg/RPGBoard';
import { OvertakeBanner } from '@/components/rpg/OvertakeBanner';
import { XPToMovementAnimation } from '@/components/rpg/XPToMovementAnimation';
import { RPGBossModal } from '@/components/rpg/RPGBossModal';
import { RPGCampaignModal } from '@/components/rpg/RPGCampaignModal';
import { checkVictory } from '@/engine/rpgEngine';
import type { Team } from '@/types';

export const RPGMovementScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id: gameId } = useParams<{ id: string }>();

  const active = useGameStore((s) => s.active);
  const advanceQuestion = useGameStore((s) => s.advanceQuestion);
  const { teams, questions, currentQuestionIndex, game } = active;

  const {
    currentMap,
    teamStates,
    initRPGGame,
    processRoundResults,
    saveCampaignResults,
  } = useRPGStore();

  const isLastQuestion = currentQuestionIndex >= (questions?.length || 1) - 1;

  // Stored breakdowns from AnswerRegistration
  const storedBreakdowns: Record<string, any> = JSON.parse(
    localStorage.getItem(`hootka_scores_${gameId}`) || '{}'
  );

  const [overtakes, setOvertakes] = useState<any[]>([]);
  const [showBossModal, setShowBossModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [btnEnabled, setBtnEnabled] = useState(false);
  const [victoryState, setVictoryState] = useState<{ isOver: boolean; winner?: Team; reason?: string } | null>(null);

  const processedRef = useRef(false);

  // Initialize or process movement
  useEffect(() => {
    soundEngine.playReveal();

    // Ensure RPG store has states for these teams
    if (Object.keys(teamStates).length === 0 && teams.length > 0) {
      initRPGGame(teams, game?.settings?.mapId);
    }

    // Process round results once per question step
    const processKey = `hootka_rpg_processed_${gameId}_q${currentQuestionIndex}`;
    const alreadyProcessed = sessionStorage.getItem(processKey);

    if (!alreadyProcessed && !processedRef.current && teams.length > 0) {
      processedRef.current = true;
      sessionStorage.setItem(processKey, 'true');

      const { overtakes: newOvertakes } = processRoundResults(teams, storedBreakdowns);
      setOvertakes(newOvertakes);

      if (newOvertakes.length > 0) {
        soundEngine.playOvertake();
      }

      // Check Boss Encounter
      const steppedOnBoss = Object.values(useRPGStore.getState().teamStates).some(
        (s) => currentMap.bossIndices.includes(s.currentTileIndex)
      );
      if (steppedOnBoss) {
        setShowBossModal(true);
      }

      // Check victory conditions
      const vic = checkVictory(
        teams,
        useRPGStore.getState().teamStates,
        currentMap,
        game?.settings || {},
        isLastQuestion
      );

      if (vic.isOver) {
        setVictoryState(vic);
        saveCampaignResults(teams);
        soundEngine.playVictory();
      }
    }

    const timer = setTimeout(() => {
      setBtnEnabled(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [gameId, currentQuestionIndex, teams, teamStates, currentMap, game, initRPGGame, processRoundResults, saveCampaignResults, storedBreakdowns, isLastQuestion]);

  const handleNext = useCallback(() => {
    if (!btnEnabled) return;

    if (victoryState?.isOver || isLastQuestion) {
      saveCampaignResults(teams);
      navigate(`/game/${gameId}/final`);
    } else {
      advanceQuestion();
      navigate(`/game/${gameId}/question`);
    }
  }, [btnEnabled, victoryState, isLastQuestion, saveCampaignResults, teams, advanceQuestion, navigate, gameId]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-background)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          borderBottom: '4px solid #0A0A0A',
          background: '#FFD600',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 0 #0A0A0A',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '2.4rem' }}>🗺️</span>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 900,
                fontSize: '1.75rem',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              HOOTKA RPG: O REINO DO CONHECIMENTO
            </h1>
            <p style={{ margin: '0.2rem 0 0', fontWeight: 800, fontSize: '0.9rem', color: '#111' }}>
              QUESTÃO {currentQuestionIndex + 1} DE {questions?.length || 1} • MAPA: {currentMap.name.toUpperCase()}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <NeoBrutalistButton
            variant="ghost"
            size="sm"
            onClick={() => setShowCampaignModal(true)}
          >
            📜 VER CRÔNICAS DA SALA
          </NeoBrutalistButton>

          <NeoBrutalistButton
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/game/${gameId}/ranking`)}
          >
            📊 TABELA DE PONTUAÇÃO
          </NeoBrutalistButton>
        </div>
      </div>

      {/* Overtakes Banner Overlay */}
      <OvertakeBanner overtakes={overtakes} onDismiss={() => setOvertakes([])} />

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
          padding: '1.5rem',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        {/* Victory Callout if Game is Over */}
        <AnimatePresence>
          {victoryState?.isOver && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                background: '#00C851',
                color: '#FFFFFF',
                border: '4px solid #0A0A0A',
                boxShadow: '6px 6px 0 #0A0A0A',
                padding: '1.25rem 2rem',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '3rem' }}>👑</span>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 900,
                  fontSize: '2rem',
                  margin: '0.25rem 0',
                  textTransform: 'uppercase',
                }}
              >
                VITÓRIA SUPREMA NO REINO!
              </h2>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem' }}>
                {victoryState.reason}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Board Canvas */}
        <RPGBoard
          map={currentMap}
          teams={teams}
          teamStates={teamStates}
        />

        {/* Live Round Conversion Cards */}
        {Object.keys(storedBreakdowns).length > 0 && (
          <XPToMovementAnimation
            teams={teams}
            teamStates={teamStates}
            roundScores={storedBreakdowns}
          />
        )}
      </div>

      {/* Boss Encounter Modal */}
      <RPGBossModal
        isOpen={showBossModal}
        onClose={() => setShowBossModal(false)}
        onProceed={() => {
          setShowBossModal(false);
          handleNext();
        }}
      />

      {/* Persistent Campaign Profiles Modal */}
      <RPGCampaignModal
        isOpen={showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
      />

      {/* Sticky Bottom Actions Bar */}
      <footer
        style={{
          borderTop: '4px solid #0A0A0A',
          background: '#0A0A0A',
          padding: '1.25rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 -4px 0 #0A0A0A',
          zIndex: 100,
        }}
      >
        <div style={{ color: '#FFD600', fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.1rem' }}>
          {victoryState?.isOver
            ? '🏆 CAMPANHA CONCLUÍDA! O REINO TEM SEUS CAMPEÕES!'
            : isLastQuestion
            ? '🏁 ÚLTIMA RODADA DISPUTADA! RUMO AO PÓDIO!'
            : '⚡ ACERTOS TRANSMUTADOS EM PASSOS NO MAPA!'}
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <NeoBrutalistButton
            variant="primary"
            size="lg"
            onClick={handleNext}
            disabled={!btnEnabled}
            style={{
              fontSize: '1.2rem',
              padding: '0.9rem 2.5rem',
              background: victoryState?.isOver || isLastQuestion ? '#00C851' : '#FFD600',
              color: '#0A0A0A',
            }}
          >
            {victoryState?.isOver || isLastQuestion ? 'VER REVELAÇÃO FINAL 🏆' : 'PRÓXIMA QUESTÃO ▶'}
          </NeoBrutalistButton>
        </div>
      </footer>
    </div>
  );
};

export default RPGMovementScreen;
