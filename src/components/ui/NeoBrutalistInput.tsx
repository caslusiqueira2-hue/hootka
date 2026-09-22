import React, { useState } from 'react';

interface NeoBrutalistInputProps {
  label?: string;
  error?: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
  name?: string;
}

const NeoBrutalistInput: React.FC<NeoBrutalistInputProps> = ({
  label,
  error,
  hint,
  value,
  onChange,
  placeholder,
  type = 'text',
  multiline = false,
  rows = 4,
  maxLength,
  disabled = false,
  className = '',
  name,
}) => {
  const [focused, setFocused] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    fontFamily: "'Inter', sans-serif",
    fontSize: '15px',
    fontWeight: 500,
    color: '#0A0A0A',
    backgroundColor: disabled ? '#E8E3DB' : '#FFFFFF',
    border: `3px solid ${error ? '#FF1744' : focused ? '#FF3B00' : '#0A0A0A'}`,
    boxShadow: error ? '4px 4px 0 #FF1744' : focused ? '4px 4px 0 #FF3B00' : '4px 4px 0 #0A0A0A',
    borderRadius: '2px',
    outline: 'none',
    transition: 'border-color 0.1s, box-shadow 0.1s',
    cursor: disabled ? 'not-allowed' : 'text',
    resize: multiline ? 'vertical' : 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#0A0A0A',
    marginBottom: '6px',
  };

  const sharedProps = {
    name,
    value,
    placeholder,
    disabled,
    maxLength,
    style: inputStyle,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  };

  return (
    <div className={className} style={{ width: '100%' }}>
      {label && <label style={labelStyle}>{label}</label>}
      {multiline ? (
        <textarea {...sharedProps} rows={rows} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...sharedProps} type={type} onChange={(e) => onChange(e.target.value)} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {error && (
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, color: '#FF1744', marginTop: '4px' }}>
              ⚠ {error}
            </p>
          )}
          {!error && hint && (
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: '#6B6459', marginTop: '4px' }}>
              {hint}
            </p>
          )}
        </div>
        {maxLength !== undefined && (
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, color: value.length === maxLength ? '#FF1744' : '#6B6459', marginTop: '4px', textAlign: 'right' }}>
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export default NeoBrutalistInput;
