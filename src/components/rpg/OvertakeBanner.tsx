import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OvertakeEvent } from '@/types';

interface OvertakeBannerProps {
  overtakes: OvertakeEvent[];
  onDismiss?: () => void;
}

export const OvertakeBanner: React.FC<OvertakeBannerProps> = ({ overtakes, onDismiss }) => {
  if (overtakes.length === 0) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          alignItems: 'center',
          pointerEvents: 'auto',
          maxWidth: '90vw',
        }}
      >
        {overtakes.map((event, idx) => (
          <motion.div
            key={`${event.team.id}-${idx}`}
            initial={{ scale: 0.8, y: -40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: -20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
              background: '#FFD600',
              border: '4px solid #0A0A0A',
              boxShadow: '6px 6px 0 #0A0A0A',
              padding: '0.75rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              borderRadius: '2px',
            }}
          >
            <span style={{ fontSize: '2rem' }}>⚡</span>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 900,
                  fontSize: '1.25rem',
                  color: '#0A0A0A',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                ULTRAPASSAGEM NO TABULEIRO!
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#222' }}>
                <span style={{ color: event.team.color }}>{event.team.emoji} {event.team.name}</span>{' '}
                saltou de <strong>{event.fromPosition}º</strong> para{' '}
                <strong style={{ color: '#00C851' }}>{event.toPosition}º LUGAR</strong>!
                {event.overtakenTeam && (
                  <span style={{ color: '#555' }}>
                    {' '}(ultrapassando {event.overtakenTeam.emoji} {event.overtakenTeam.name})
                  </span>
                )}
              </div>
            </div>

            {onDismiss && (
              <button
                onClick={onDismiss}
                style={{
                  background: 'transparent',
                  border: '2px solid #0A0A0A',
                  fontWeight: 900,
                  fontSize: '0.8rem',
                  padding: '0.25rem 0.5rem',
                  cursor: 'pointer',
                  marginLeft: '0.5rem',
                }}
              >
                ✕
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
};

export default OvertakeBanner;
