import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import soundEngine from '@/utils/soundEngine';

function CountUp({
  from = 0,
  to,
  duration = 1.2,
  className = '',
}: {
  from?: number;
  to: number;
  duration?: number;
  className?: string;
}) {
  const motionVal = useMotionValue(from);
  const [display, setDisplay] = useState(from);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const ctrl = animate(motionVal, to, {
      duration,
      ease: 'easeOut',
      onUpdate: (v: number) => setDisplay(Math.round(v)),
    });
    return () => ctrl.stop();
  }, [to, duration, motionVal]);

  return <span className={className}>{display}</span>;
}

export const ScoreAnimation: React.FC = () => {
  const navigate = useNavigate();
  const { id: gameId } = useParams<{ id: string }>();

  const active = useGameStore((s) => s.active);
  const { teams, game } = active;

  // Retrieve stored scores from AnswerRegistration
  const storedBreakdowns: Record<string, any> = JSON.parse(
    localStorage.getItem(`hootka_scores_${gameId}`) || '{}'
  );

  const teamList = teams.map((t) => {
    const bd = storedBreakdowns[t.id] || {
      correct: false,
      baseScore: 0,
      speedBonus: 0,
      orderBonus: 0,
      recoveryBonus: 0,
      streakBonus: 0,
      specialBonus: 0,
      penalty: 0,
      totalScore: 0,
    };
    return {
      teamId: t.id,
      teamName: t.name,
      teamEmoji: t.emoji,
      teamColor: t.color,
      correct: Boolean(bd.correct),
      scoreResult: bd,
    };
  });

  const STAGGER = 0.4;
  const REVEAL_DURATION = 1.2;
  const totalRevealMs = (teamList.length * STAGGER + REVEAL_DURATION) * 1000;

  const [showUpdating, setShowUpdating] = useState(false);

  const handleProceed = () => {
    navigate(`/game/${gameId}/ranking`);
  };

  useEffect(() => {
    soundEngine.playCorrect();

    const t1 = setTimeout(() => setShowUpdating(true), totalRevealMs);
    return () => {
      clearTimeout(t1);
    };
  }, [gameId, totalRevealMs]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-background)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          borderBottom: '4px solid #0A0A0A',
          background: '#FFD600',
          padding: '1.25rem 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 4px 0 #0A0A0A',
        }}
      >
        <span style={{ fontSize: '2.5rem' }}>📊</span>
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
          PONTUAÇÃO DA QUESTÃO
        </h1>
      </div>

      {/* Teams Grid */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          padding: '2rem',
          alignContent: 'start',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {teamList.map((t, idx) => {
          const delay = idx * STAGGER;
          const sr = t.scoreResult;

          return (
            <motion.div
              key={t.teamId}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay, type: 'spring', stiffness: 300, damping: 24 }}
              style={{
                border: '4px solid #0A0A0A',
                boxShadow: '6px 6px 0 #0A0A0A',
                background: '#FFFFFF',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  background: t.teamColor,
                  borderBottom: '3px solid #0A0A0A',
                }}
              >
                <span style={{ fontSize: '2.2rem' }}>{t.teamEmoji}</span>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 900,
                    fontSize: '1.4rem',
                    color: '#0A0A0A',
                    textTransform: 'uppercase',
                  }}
                >
                  {t.teamName}
                </span>
              </div>

              {/* Body */}
              <div style={{ padding: '1.25rem', background: '#FFFDF9' }}>
                {!t.correct ? (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      padding: '1.5rem 0',
                    }}
                  >
                    <span style={{ fontSize: '2rem', color: '#FF1744' }}>✖</span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.5rem', color: '#FF1744' }}>
                      {sr.selectedAnswer === '-' ? 'SEM RESPOSTA (0 PTS)' : sr.penalty > 0 ? `3 ERROS: −${sr.penalty} PTS` : 'ERROU (0 PTS)'}
                    </span>
                  </motion.div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem' }}>
                      <span>Acerto Base:</span>
                      <span>+{sr.baseScore}</span>
                    </div>

                    {sr.orderBonus > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#1A1AFF', fontSize: '1rem' }}>
                        <span>🏁 Entre os 3 primeiros:</span>
                        <span>+{sr.orderBonus}</span>
                      </div>
                    )}

                    {sr.recoveryBonus > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#FF6D00', fontSize: '1rem' }}>
                        <span>🛡️ Recuperação:</span>
                        <span>+{sr.recoveryBonus}</span>
                      </div>
                    )}

                    {sr.streakBonus > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#9B59B6', fontSize: '1rem' }}>
                        <span>🔥 Streak:</span>
                        <span>+{sr.streakBonus}</span>
                      </div>
                    )}

                    {/* Total Row */}
                    <div
                      style={{
                        marginTop: '0.5rem',
                        borderTop: '2px solid #0A0A0A',
                        paddingTop: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#FFD600',
                        border: '2px solid #0A0A0A',
                        padding: '0.6rem 0.8rem',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.1rem' }}>
                        TOTAL:
                      </span>
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.6rem' }}>
                        +<CountUp to={sr.totalScore} duration={1.2} />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Updating Footer */}
      <div
        style={{
          minHeight: '80px',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#0A0A0A',
          color: '#FFFFFF',
          borderTop: '4px solid #0A0A0A',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <AnimatePresence>
          {showUpdating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: 900,
                fontSize: '1.25rem',
                letterSpacing: '0.06em',
                color: '#FFD600',
              }}
            >
              <span>ATUALIZANDO RANKING...</span>
              <span>📈</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => navigate(`/game/${gameId}/answers`)} style={{ background: '#FFFFFF', color: '#0A0A0A', border: '2px solid #FFFFFF', padding: '0.6rem 1rem', fontWeight: 900, cursor: 'pointer' }}>
          CORRIGIR MARCAÇÕES
        </button>
        <button
          onClick={handleProceed}
          style={{
            marginLeft: 'auto',
            background: '#FFD600',
            color: '#0A0A0A',
            border: '2px solid #FFFFFF',
            boxShadow: '3px 3px 0 #FFFFFF',
            padding: '0.6rem 1.4rem',
            fontFamily: 'var(--font-heading)',
            fontWeight: 900,
            fontSize: '1rem',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          IR PARA O RANKING ➔
        </button>
      </div>
    </div>
  );
};

export default ScoreAnimation;
