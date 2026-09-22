import React from 'react';
import { motion } from 'framer-motion';
import { TeamScore } from '@/types';

interface NeoBrutalistRankingCardProps {
  position: number;
  team: TeamScore;
  isNew?: boolean;
  previousPosition?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const positionBg: Record<number, string> = {
  1: '#FFD600',
  2: '#E8E3DB',
  3: '#FF6D00',
};

const sizeConfig = {
  sm: { positionFont: '28px', emojiFont: '32px', nameFont: '14px', scoreFont: '18px', padding: '12px 16px' },
  md: { positionFont: '42px', emojiFont: '44px', nameFont: '18px', scoreFont: '24px', padding: '16px 20px' },
  lg: { positionFont: '64px', emojiFont: '60px', nameFont: '24px', scoreFont: '32px', padding: '22px 28px' },
};

function formatPosition(n: number): string {
  return String(n).padStart(2, '0');
}

function PositionArrow({ prev, curr }: { prev?: number; curr: number }) {
  if (prev === undefined || prev === curr) return null;
  const up = curr < prev;
  return (
    <span style={{
      fontSize: '18px',
      color: up ? '#00C851' : '#FF1744',
      fontWeight: 900,
      marginLeft: '6px',
      lineHeight: 1,
    }}>
      {up ? '▲' : '▼'}
    </span>
  );
}

const NeoBrutalistRankingCard: React.FC<NeoBrutalistRankingCardProps> = ({
  position,
  team,
  isNew = false,
  previousPosition,
  showScore = true,
  size = 'md',
}) => {
  const cfg = sizeConfig[size];
  const bg = positionBg[position] ?? '#FFFFFF';
  const isFirst = position === 1;

  return (
    <motion.div
      layoutId={team.teamId}
      initial={isNew ? { opacity: 0, y: -40 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      style={{
        backgroundColor: bg,
        border: `3px solid #0A0A0A`,
        boxShadow: isFirst ? '8px 8px 0 #0A0A0A' : '6px 6px 0 #0A0A0A',
        borderRadius: '2px',
        padding: cfg.padding,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Position number */}
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 900,
        fontSize: cfg.positionFont,
        color: '#0A0A0A',
        lineHeight: 1,
        minWidth: isFirst ? '72px' : '56px',
        display: 'flex',
        alignItems: 'center',
      }}>
        {formatPosition(position)}
        <PositionArrow prev={previousPosition} curr={position} />
      </div>

      {/* Divider */}
      <div style={{ width: '3px', alignSelf: 'stretch', backgroundColor: '#0A0A0A', flexShrink: 0 }} />

      {/* Emoji */}
      <div style={{ fontSize: cfg.emojiFont, lineHeight: 1, flexShrink: 0 }}>{team.teamEmoji || (team as any).emoji}</div>

      {/* Team info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 800,
          fontSize: cfg.nameFont,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#0A0A0A',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {team.teamName}
        </div>
        {showScore && (
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: cfg.scoreFont,
            color: isFirst ? '#0A0A0A' : '#FF3B00',
            marginTop: '2px',
          }}>
            {team.totalScore.toLocaleString()} pts
          </div>
        )}
      </div>

      {/* NEW badge */}
      {isNew && (
        <div style={{
          position: 'absolute',
          top: '-12px',
          right: '12px',
          backgroundColor: '#FF3B00',
          color: '#FFFFFF',
          border: '2px solid #0A0A0A',
          boxShadow: '2px 2px 0 #0A0A0A',
          borderRadius: '2px',
          padding: '2px 8px',
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 800,
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          NEW
        </div>
      )}
    </motion.div>
  );
};

export default NeoBrutalistRankingCard;
