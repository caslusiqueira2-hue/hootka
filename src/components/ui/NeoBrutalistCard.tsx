import React from 'react';
import { motion } from 'framer-motion';

type CardVariant = 'default' | 'primary' | 'accent' | 'dark';

interface NeoBrutalistCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: CardVariant;
  elevated?: boolean;
  style?: React.CSSProperties;
}

const variantStyles: Record<CardVariant, React.CSSProperties> = {
  default: { backgroundColor: '#FFFFFF', color: '#0A0A0A' },
  primary: { backgroundColor: '#FFD600', color: '#0A0A0A' },
  accent:  { backgroundColor: '#FF3B00', color: '#FFFFFF' },
  dark:    { backgroundColor: '#0A0A0A', color: '#FFFFFF' },
};

const NeoBrutalistCard: React.FC<NeoBrutalistCardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default',
  elevated = false,
  style = {},
}) => {
  const isClickable = !!onClick;
  const shadow = elevated ? '10px 10px 0 #0A0A0A' : '6px 6px 0 #0A0A0A';

  const baseStyle: React.CSSProperties = {
    ...variantStyles[variant],
    border: '3px solid #0A0A0A',
    boxShadow: shadow,
    borderRadius: '2px',
    padding: '20px',
    cursor: isClickable ? 'pointer' : 'default',
    userSelect: 'none',
    position: 'relative',
    ...style,
  };

  if (isClickable) {
    return (
      <motion.div
        style={baseStyle}
        className={className}
        onClick={onClick}
        whileHover={{ x: 3, y: 3, boxShadow: '2px 2px 0 #0A0A0A' }}
        whileTap={{ x: 5, y: 5, boxShadow: '0px 0px 0 #0A0A0A' }}
        transition={{ type: 'tween', duration: 0.05 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div style={baseStyle} className={className}>
      {children}
    </div>
  );
};

export default NeoBrutalistCard;
