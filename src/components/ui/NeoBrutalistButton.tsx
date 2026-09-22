import React from 'react';
import { motion } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface NeoBrutalistButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { backgroundColor: '#FFD600', color: '#0A0A0A', border: '3px solid #0A0A0A', boxShadow: '6px 6px 0 #0A0A0A' },
  secondary: { backgroundColor: '#1A1AFF', color: '#FFFFFF', border: '3px solid #0A0A0A', boxShadow: '6px 6px 0 #0A0A0A' },
  accent:    { backgroundColor: '#FF3B00', color: '#FFFFFF', border: '3px solid #0A0A0A', boxShadow: '6px 6px 0 #0A0A0A' },
  danger:    { backgroundColor: '#FF1744', color: '#FFFFFF', border: '3px solid #0A0A0A', boxShadow: '6px 6px 0 #0A0A0A' },
  ghost:     { backgroundColor: '#FFFFFF', color: '#0A0A0A', border: '3px solid #0A0A0A', boxShadow: '6px 6px 0 #0A0A0A' },
  success:   { backgroundColor: '#00C851', color: '#FFFFFF', border: '3px solid #0A0A0A', boxShadow: '6px 6px 0 #0A0A0A' },
};

const sizeStyles: Record<ButtonSize, { padding: string; fontSize: string; fontWeight: number }> = {
  sm: { padding: '6px 14px',  fontSize: '13px', fontWeight: 700 },
  md: { padding: '10px 22px', fontSize: '15px', fontWeight: 700 },
  lg: { padding: '14px 30px', fontSize: '18px', fontWeight: 800 },
  xl: { padding: '20px 48px', fontSize: '24px', fontWeight: 900 },
};

const Spinner: React.FC<{ color: string }> = ({ color }) => (
  <svg
    className="animate-spin"
    style={{ width: '1.1em', height: '1.1em', marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }}
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeOpacity="0.25" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const NeoBrutalistButton: React.FC<NeoBrutalistButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
  className = '',
  style,
}) => {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];
  const isDisabled = disabled || loading;
  const spinnerColor = variant === 'primary' ? '#0A0A0A' : '#FFFFFF';

  const baseStyle: React.CSSProperties = {
    ...vStyle,
    ...sStyle,
    ...style,
    borderRadius: '2px',
    fontFamily: "'Space Grotesk', sans-serif",
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: fullWidth ? '100%' : 'auto',
    userSelect: 'none',
    transition: 'none',
    outline: 'none',
    position: 'relative',
    opacity: isDisabled ? 0.6 : 1,
  };

  return (
    <motion.button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      style={baseStyle}
      className={className}
      whileHover={isDisabled ? {} : { x: 3, y: 3, boxShadow: '2px 2px 0 #0A0A0A' }}
      whileTap={isDisabled ? {} : { x: 5, y: 5, boxShadow: '0px 0px 0 #0A0A0A' }}
      transition={{ type: 'tween', duration: 0.05 }}
    >
      {loading && <Spinner color={spinnerColor} />}
      {children}
    </motion.button>
  );
};

export default NeoBrutalistButton;
