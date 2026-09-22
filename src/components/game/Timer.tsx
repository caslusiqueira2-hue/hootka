import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimerProps {
  timeLeft: number;
  totalTime: number;
  isUrgent?: boolean;
}

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const Timer: React.FC<TimerProps> = ({ timeLeft, totalTime, isUrgent = false }) => {
  const progress = Math.max(0, Math.min(1, timeLeft / totalTime));
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const color = isUrgent ? '#FF1744' : '#FFD600';
  const bgColor = isUrgent ? 'rgba(255,23,68,0.12)' : 'rgba(255,214,0,0.1)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <motion.div
        animate={isUrgent ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={isUrgent ? { duration: 0.7, repeat: Infinity, ease: 'easeInOut' } : {}}
        style={{ position: 'relative', width: '140px', height: '140px' }}
      >
        {/* Background circle */}
        <svg width="140" height="140" style={{ position: 'absolute', top: 0, left: 0 }}>
          <circle
            cx="70" cy="70" r={RADIUS}
            fill={bgColor}
            stroke="#0A0A0A"
            strokeWidth="3"
          />
        </svg>

        {/* Progress ring */}
        <svg
          width="140"
          height="140"
          style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
        >
          <motion.circle
            cx="70" cy="70" r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="square"
            strokeDasharray={CIRCUMFERENCE}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.4, ease: 'linear' }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>

        {/* Number */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={timeLeft}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 900,
                fontSize: '52px',
                color: isUrgent ? '#FF1744' : '#0A0A0A',
                lineHeight: 1,
              }}
            >
              {timeLeft}
            </motion.span>
          </AnimatePresence>
        </div>
      </motion.div>

      {isUrgent && (
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 900,
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: '#FF1744',
          }}
        >
          ⚡ URGENTE
        </motion.div>
      )}
    </div>
  );
};

export default Timer;
