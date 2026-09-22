import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { TeamScore, ScoreResult } from '@/types';

interface NeoBrutalistScoreCardProps {
  team: TeamScore;
  scoreResult: ScoreResult;
  animating?: boolean;
}

interface ScoreRowProps {
  label: string;
  value: number;
  color?: string;
}

const ScoreRow: React.FC<ScoreRowProps> = ({ label, value, color = '#0A0A0A' }) => {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '14px', color: '#6B6459' }}>
        {label}
      </span>
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '16px', color }}>
        +{value}
      </span>
    </div>
  );
};

const NeoBrutalistScoreCard: React.FC<NeoBrutalistScoreCardProps> = ({
  team,
  scoreResult,
  animating = false,
}) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());
  const total = scoreResult.totalScore ?? 0;

  useEffect(() => {
    if (animating && total > 0) {
      const controls = animate(count, total, { duration: 1.8, ease: 'easeOut' });
      return controls.stop;
    } else {
      count.set(total);
    }
  }, [animating, total, count]);

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '3px solid #0A0A0A',
      boxShadow: animating ? '10px 10px 0 #0A0A0A' : '6px 6px 0 #0A0A0A',
      borderRadius: '2px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Winner glow */}
      {animating && (
        <motion.div
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#FFD600',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      {/* Header */}
      <div style={{
        backgroundColor: '#0A0A0A',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        position: 'relative',
        zIndex: 1,
      }}>
        <span style={{ fontSize: '40px', lineHeight: 1 }}>{team.teamEmoji || (team as any).emoji}</span>
        <div>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 900,
            fontSize: '18px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#FFFFFF',
          }}>
            {team.teamName}
          </div>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: '12px',
            color: '#9B9489',
          }}>
            Total acumulado: {team.totalScore.toLocaleString()} pts
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div style={{ padding: '16px 20px', borderBottom: '2px solid #E8E3DB', position: 'relative', zIndex: 1 }}>
        <ScoreRow label="Pontos base"       value={scoreResult.baseScore}     color="#0A0A0A" />
        <ScoreRow label="Bônus de velocidade" value={scoreResult.speedBonus}   color="#1A1AFF" />
        <ScoreRow label="Bônus de recuperação" value={scoreResult.recoveryBonus ?? 0} color="#FF6D00" />
        <ScoreRow label="Bônus de sequência" value={scoreResult.streakBonus ?? 0}  color="#00C851" />
        <ScoreRow label="Bônus especial"    value={scoreResult.specialBonus ?? 0}  color="#FF3B00" />
      </div>

      {/* Big total */}
      <div style={{
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '4px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: '#6B6459',
        }}>
          Esta rodada
        </div>
        <motion.div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 900,
          fontSize: '56px',
          color: '#FF3B00',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {rounded}
        </motion.div>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          fontSize: '13px',
          color: '#6B6459',
        }}>
          pontos ganhos
        </div>
      </div>
    </div>
  );
};

export default NeoBrutalistScoreCard;
