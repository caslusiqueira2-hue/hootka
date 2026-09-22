import React from 'react';
import { motion } from 'framer-motion';
import { Team } from '@/types';
import NeoBrutalistButton from './NeoBrutalistButton';

interface NeoBrutalistTeamCardProps {
  team: Team;
  onEdit?: () => void;
  onDelete?: () => void;
  showScore?: boolean;
  score?: number;
  variant?: 'default' | 'game';
}

const NeoBrutalistTeamCard: React.FC<NeoBrutalistTeamCardProps> = ({
  team,
  onEdit,
  onDelete,
  showScore = false,
  score,
  variant = 'default',
}) => {
  const isGame = variant === 'game';

  return (
    <motion.div
      layout
      style={{
        backgroundColor: '#FFFFFF',
        border: '3px solid #0A0A0A',
        boxShadow: '6px 6px 0 #0A0A0A',
        borderRadius: '2px',
        padding: isGame ? '20px 16px' : '18px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        position: 'relative',
        width: '100%',
      }}
    >
      {/* Color swatch bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '6px',
        backgroundColor: team.color,
        borderBottom: '3px solid #0A0A0A',
      }} />

      {/* Emoji */}
      <div style={{
        fontSize: isGame ? '56px' : '48px',
        lineHeight: 1,
        marginTop: '10px',
        userSelect: 'none',
      }}>
        {team.emoji}
      </div>

      {/* Team name */}
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 800,
        fontSize: isGame ? '20px' : '16px',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: '#0A0A0A',
        textAlign: 'center',
        lineHeight: 1.2,
      }}>
        {team.name || (team as any).teamName}
      </div>

      {/* Score (game variant) */}
      {showScore && score !== undefined && (
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 900,
          fontSize: '36px',
          color: '#FF3B00',
          lineHeight: 1,
          border: '3px solid #0A0A0A',
          boxShadow: '4px 4px 0 #0A0A0A',
          borderRadius: '2px',
          padding: '6px 18px',
          backgroundColor: '#FFD600',
        }}>
          {score.toLocaleString()}
        </div>
      )}

      {/* Edit / Delete buttons (default variant) */}
      {!isGame && (onEdit || onDelete) && (
        <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '4px' }}>
          {onEdit && (
            <NeoBrutalistButton
              variant="ghost"
              size="sm"
              onClick={onEdit}
              fullWidth
            >
              ✏ Edit
            </NeoBrutalistButton>
          )}
          {onDelete && (
            <NeoBrutalistButton
              variant="danger"
              size="sm"
              onClick={onDelete}
              fullWidth
            >
              ✕ Del
            </NeoBrutalistButton>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default NeoBrutalistTeamCard;
