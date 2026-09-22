import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Team, RPGTeamState } from '@/types';
import NeoBrutalistCard from '@/components/ui/NeoBrutalistCard';

interface XPToMovementAnimationProps {
  teams: Team[];
  teamStates: Record<string, RPGTeamState>;
  roundScores: Record<string, any>;
  onAnimationComplete?: () => void;
}

export const XPToMovementAnimation: React.FC<XPToMovementAnimationProps> = ({
  teams,
  teamStates,
  roundScores,
  onAnimationComplete,
}) => {
  const [stage, setStage] = useState<'xp' | 'movement' | 'done'>('xp');

  useEffect(() => {
    const t1 = setTimeout(() => setStage('movement'), 1600);
    const t2 = setTimeout(() => {
      setStage('done');
      if (onAnimationComplete) onAnimationComplete();
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onAnimationComplete]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem',
        width: '100%',
        maxWidth: '1200px',
        margin: '1rem auto',
      }}
    >
      {teams.map((team, idx) => {
        const scoreInfo = roundScores[team.id] || { totalScore: 0, correct: false };
        const state = teamStates[team.id];
        const isCorrect = Boolean(scoreInfo.correct);

        // Movement translation
        let steps = 0;
        if (scoreInfo.totalScore >= 250) steps = 4;
        else if (scoreInfo.totalScore >= 180) steps = 3;
        else if (scoreInfo.totalScore >= 100) steps = 2;
        else if (scoreInfo.totalScore > 0) steps = 1;

        return (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.15 }}
          >
            <NeoBrutalistCard
              style={{
                padding: '1rem',
                borderLeft: `8px solid ${team.color}`,
                background: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '2rem' }}>{team.emoji}</span>
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 900,
                        fontSize: '1.1rem',
                        textTransform: 'uppercase',
                      }}
                    >
                      {team.name}
                    </h4>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#666' }}>
                      {state?.title || 'Aprendiz'} • Nível {state?.level || 1}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {stage === 'xp' ? (
                    <motion.div
                      key="xp"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 900,
                        fontSize: '1.3rem',
                        color: isCorrect ? '#00C851' : '#FF1744',
                      }}
                    >
                      {isCorrect ? `+${scoreInfo.totalScore} XP` : '0 XP'}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="movement"
                      initial={{ scale: 0.8, x: 10 }}
                      animate={{ scale: 1, x: 0 }}
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 900,
                        fontSize: '1.25rem',
                        color: isCorrect ? '#1A1AFF' : '#666',
                      }}
                    >
                      {steps > 0 ? `➔ +${steps} CASAS 🎲` : 'PARADO 🛑'}
                    </motion.div>
                  )}
                </div>
              </div>
            </NeoBrutalistCard>
          </motion.div>
        );
      })}
    </div>
  );
};

export default XPToMovementAnimation;
