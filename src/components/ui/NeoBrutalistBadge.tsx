import React from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'danger' | 'warning';

interface NeoBrutalistBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  primary:   { backgroundColor: '#FFD600', color: '#0A0A0A', border: '2px solid #0A0A0A', boxShadow: '3px 3px 0 #0A0A0A' },
  secondary: { backgroundColor: '#1A1AFF', color: '#FFFFFF', border: '2px solid #0A0A0A', boxShadow: '3px 3px 0 #0A0A0A' },
  accent:    { backgroundColor: '#FF3B00', color: '#FFFFFF', border: '2px solid #0A0A0A', boxShadow: '3px 3px 0 #0A0A0A' },
  success:   { backgroundColor: '#00C851', color: '#FFFFFF', border: '2px solid #0A0A0A', boxShadow: '3px 3px 0 #0A0A0A' },
  danger:    { backgroundColor: '#FF1744', color: '#FFFFFF', border: '2px solid #0A0A0A', boxShadow: '3px 3px 0 #0A0A0A' },
  warning:   { backgroundColor: '#FF6D00', color: '#FFFFFF', border: '2px solid #0A0A0A', boxShadow: '3px 3px 0 #0A0A0A' },
};

const NeoBrutalistBadge: React.FC<NeoBrutalistBadgeProps> = ({
  children,
  variant = 'primary',
  className = '',
}) => {
  const style: React.CSSProperties = {
    ...variantStyles[variant],
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '2px',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    lineHeight: '1.5',
    whiteSpace: 'nowrap',
  };

  return (
    <span style={style} className={className}>
      {children}
    </span>
  );
};

export default NeoBrutalistBadge;
