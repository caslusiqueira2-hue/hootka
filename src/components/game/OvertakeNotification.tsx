import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OvertakeEvent } from '@/types';

interface OvertakeNotificationProps {
  events: OvertakeEvent[];
  onDone?: () => void;
}

export const OvertakeNotification: React.FC<OvertakeNotificationProps> = ({ events, onDone }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!events || events.length === 0) return;
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [events, currentIndex]);

  const handleExitComplete = () => {
    if (currentIndex + 1 < events.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onDone?.();
    }
  };

  if (!events || events.length === 0 || currentIndex >= events.length) {
    return null;
  }

  const current = events[currentIndex] as any;
  const overtakingName = current.overtakingTeamName || current.team?.name || 'Equipe';
  const overtakingEmoji = current.overtakingEmoji || current.team?.emoji || '🚀';
  const overtakenName = current.overtakenTeamName || current.overtakenTeam?.name || 'Adversário';
  const overtakenEmoji = current.overtakenEmoji || current.overtakenTeam?.emoji || '🎯';
  const newPos = current.newPosition || current.toPosition || 1;

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
        {visible && (
          <motion.div
            key={currentIndex}
            initial={{ y: -80, opacity: 0, scale: 0.85 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 480, damping: 32 }}
            style={{
              backgroundColor: '#FF3B00',
              border: '3px solid #0A0A0A',
              boxShadow: '8px 8px 0 #0A0A0A',
              borderRadius: '2px',
              padding: '16px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              minWidth: '320px',
            }}
          >
            {/* Banner title */}
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 900,
                fontSize: '20px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#FFD600',
                lineHeight: 1,
              }}
            >
              🔥 ULTRAPASSAGEM!
            </div>

            {/* Teams row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#FFFFFF',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800,
                fontSize: '15px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <span style={{ fontSize: '24px' }}>{overtakingEmoji}</span>
              <span>{overtakingName}</span>
              <span style={{ color: '#FFD600', fontSize: '18px' }}>▲</span>
              <span style={{ opacity: 0.6, fontSize: '13px' }}>passou</span>
              <span style={{ fontSize: '24px' }}>{overtakenEmoji}</span>
              <span style={{ opacity: 0.75 }}>{overtakenName}</span>
            </div>

            {/* Position badge */}
            <div
              style={{
                backgroundColor: '#FFD600',
                color: '#0A0A0A',
                border: '2px solid #0A0A0A',
                borderRadius: '2px',
                padding: '2px 12px',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 900,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Agora em {String(newPos).padStart(2, '0')}º lugar
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OvertakeNotification;
