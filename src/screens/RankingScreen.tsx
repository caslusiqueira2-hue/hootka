import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import soundEngine from '@/utils/soundEngine';
import NeoBrutalistButton from '@/components/ui/NeoBrutalistButton';

interface OvertakeAlert {
  id: string;
  message: string;
}

export const RankingScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id: gameId } = useParams<{ id: string }>();

  const active = useGameStore((s) => s.active);
  const advanceQuestion = useGameStore((s) => s.advanceQuestion);
  const { teams, questions, currentQuestionIndex } = active;

  const isLastQuestion = currentQuestionIndex >= questions.length - 1;

  // Retrieve previous ranking from localStorage
  const prevRankingKey = `hootka_prev_rank_${gameId}`;
  const prevRankings: Record<string, number> = JSON.parse(
    localStorage.getItem(prevRankingKey) || '{}'
  );

  // Sort current teams by score descending
  const sortedTeams = [...teams].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  // Build ranked team objects with delta
  const currentRanked = sortedTeams.map((team, idx) => {
    const currentRank = idx + 1;
    const prevRank = prevRankings[team.id];
    const rankChange = prevRank !== undefined ? prevRank - currentRank : 0;
    return {
      ...team,
      rank: currentRank,
      previousRank: prevRank,
      rankChange,
    };
  });

  const [notifications, setNotifications] = useState<OvertakeAlert[]>([]);
  const [btnEnabled, setBtnEnabled] = useState(false);

  // Detect overtakes and trigger alerts
  useEffect(() => {
    const overtakers = currentRanked.filter((t) => t.rankChange > 0 && t.previousRank !== undefined);

    if (overtakers.length > 0) {
      soundEngine.playOvertake();

      const newAlerts: OvertakeAlert[] = overtakers.map((t) => {
        const overtakenTeam = currentRanked.find((ct) => ct.rank === t.previousRank);
        return {
          id: t.id + '-' + Date.now(),
          message: `🔥 ${t.name} ULTRAPASSOU ${overtakenTeam ? overtakenTeam.name : 'ADVERSÁRIO'}! (${t.previousRank}º → ${t.rank}º)`,
        };
      });

      setNotifications(newAlerts);
    }

    // Save current rankings for next question
    const nextRankMap: Record<string, number> = {};
    currentRanked.forEach((t) => {
      nextRankMap[t.id] = t.rank;
    });
    localStorage.setItem(prevRankingKey, JSON.stringify(nextRankMap));

    // Enable button after 2 seconds
    const timer = setTimeout(() => {
      setBtnEnabled(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleNext = useCallback(() => {
    if (!btnEnabled) return;

    if (isLastQuestion) {
      navigate(`/game/${gameId}/final`);
    } else {
      advanceQuestion();
      navigate(`/game/${gameId}/question`);
    }
  }, [btnEnabled, isLastQuestion, gameId, advanceQuestion, navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-background)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          borderBottom: '4px solid #0A0A0A',
          background: '#0A0A0A',
          color: '#FFFFFF',
          padding: '1.25rem 2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '2rem' }}>🏅</span>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 900,
              fontSize: '2rem',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            RANKING DA PARTIDA
          </h1>
        </div>

        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '1rem',
            color: '#FFD600',
            letterSpacing: '0.04em',
          }}
        >
          QUESTÃO {currentQuestionIndex + 1} DE {questions.length} CONCLUÍDA
        </span>
      </div>

      {/* Overtake Floating Banners */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ y: -50, opacity: 0, scale: 0.85 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
              style={{
                background: '#FF3B00',
                color: '#FFFFFF',
                border: '4px solid #0A0A0A',
                boxShadow: '6px 6px 0 #0A0A0A',
                padding: '0.85rem 1.75rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: 900,
                fontSize: '1.25rem',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {notif.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Dynamic Ranking List */}
      <div
        style={{
          flex: 1,
          maxWidth: '850px',
          margin: '0 auto',
          width: '100%',
          padding: '2rem 1.5rem',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}
      >
        <AnimatePresence>
          {currentRanked.map((team) => {
            const isFirst = team.rank === 1;
            const hasOvertaken = team.rankChange > 0;
            const hasFallen = team.rankChange < 0;

            return (
              <motion.div
                key={team.id}
                layout
                layoutId={`team-${team.id}`}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: isFirst ? '1.25rem 1.75rem' : '1rem 1.5rem',
                  border: isFirst ? '5px solid #0A0A0A' : '4px solid #0A0A0A',
                  background: isFirst ? '#FFD600' : '#FFFFFF',
                  boxShadow: isFirst ? '8px 8px 0 #0A0A0A' : '5px 5px 0 #0A0A0A',
                  position: 'relative',
                }}
              >
                {/* Position Badge */}
                <div
                  style={{
                    width: isFirst ? '56px' : '48px',
                    height: isFirst ? '56px' : '48px',
                    background: isFirst ? '#0A0A0A' : '#F5F0E8',
                    color: isFirst ? '#FFD600' : '#0A0A0A',
                    border: '3px solid #0A0A0A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 900,
                    fontSize: isFirst ? '1.75rem' : '1.35rem',
                    flexShrink: 0,
                  }}
                >
                  {String(team.rank).padStart(2, '0')}
                </div>

                {/* Team Emoji */}
                <span style={{ fontSize: isFirst ? '3rem' : '2.4rem' }}>{team.emoji}</span>

                {/* Name & Overtake Indicator */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h3
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 900,
                        fontSize: isFirst ? '1.6rem' : '1.3rem',
                        margin: 0,
                        color: '#0A0A0A',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {team.name}
                    </h3>

                    {/* Arrow Indicator */}
                    {hasOvertaken && (
                      <span
                        style={{
                          background: '#00C851',
                          color: '#FFFFFF',
                          border: '2px solid #0A0A0A',
                          padding: '0.1rem 0.6rem',
                          fontWeight: 900,
                          fontSize: '0.8rem',
                          fontFamily: 'var(--font-heading)',
                        }}
                      >
                        ↑ {team.previousRank}º → {team.rank}º
                      </span>
                    )}
                    {hasFallen && (
                      <span
                        style={{
                          background: '#FF1744',
                          color: '#FFFFFF',
                          border: '2px solid #0A0A0A',
                          padding: '0.1rem 0.6rem',
                          fontWeight: 900,
                          fontSize: '0.8rem',
                          fontFamily: 'var(--font-heading)',
                        }}
                      >
                        ↓ {team.previousRank}º → {team.rank}º
                      </span>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 900,
                      fontSize: isFirst ? '2.2rem' : '1.75rem',
                      color: '#0A0A0A',
                    }}
                  >
                    {(team.score ?? 0).toLocaleString('pt-BR')}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#666' }}>
                    PONTOS
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div
        style={{
          borderTop: '4px solid #0A0A0A',
          background: '#FFFFFF',
          padding: '1.25rem 2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#666' }}>
          {btnEnabled ? 'Pressione Enter ou clique no botão para avançar' : 'Aguarde a animação do ranking...'}
        </span>

        <NeoBrutalistButton
          variant="primary"
          size="lg"
          onClick={handleNext}
          disabled={!btnEnabled}
          style={{ minWidth: '280px', fontSize: '1.25rem', fontWeight: 900 }}
        >
          {isLastQuestion ? 'VER RESULTADO FINAL 🏆 (Enter)' : 'PRÓXIMA QUESTÃO → (Enter)'}
        </NeoBrutalistButton>
      </div>
    </div>
  );
};

export default RankingScreen;
