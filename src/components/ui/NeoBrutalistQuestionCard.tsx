import React from 'react';
import { motion } from 'framer-motion';
import { GameQuestion } from '@/types';

interface NeoBrutalistQuestionCardProps {
  question: GameQuestion;
  questionNumber: number;
  totalQuestions: number;
  revealed?: boolean;
  correctAnswer?: string;
}

const OPTION_COLORS = ['#FFD600', '#1A1AFF', '#FF6D00', '#00C851'];
const OPTION_TEXT_COLORS = ['#0A0A0A', '#FFFFFF', '#FFFFFF', '#FFFFFF'];
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export const NeoBrutalistQuestionCard: React.FC<NeoBrutalistQuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
  revealed = false,
  correctAnswer,
}) => {
  const isWildcard = Boolean(question.is_wildcard);
  const isSpecial = Boolean(question.is_special);
  const options = [question.option_a, question.option_b, question.option_c, question.option_d];

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 900,
          fontSize: '14px',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: '#6B6459',
          border: '2px solid #0A0A0A',
          boxShadow: '3px 3px 0 #0A0A0A',
          borderRadius: '2px',
          padding: '4px 12px',
          backgroundColor: '#FFFFFF',
        }}>
          QUESTÃO {String(questionNumber).padStart(2, '0')} / {String(totalQuestions).padStart(2, '0')}
        </div>

        {isSpecial && (
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 800,
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#FFFFFF',
            backgroundColor: '#1A1AFF',
            border: '2px solid #0A0A0A',
            boxShadow: '3px 3px 0 #0A0A0A',
            borderRadius: '2px',
            padding: '4px 12px',
          }}>
            ⭐ ESPECIAL (+50% BÔNUS)
          </div>
        )}
      </div>

      {/* Wildcard banner */}
      {isWildcard && (
        <motion.div
          animate={{ scale: [1, 1.01, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          style={{
            backgroundColor: '#FFD600',
            border: '3px solid #0A0A0A',
            boxShadow: '4px 4px 0 #0A0A0A',
            borderRadius: '2px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 900,
            fontSize: '15px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          <span>⚡</span>
          <span>QUESTÃO DE VIRADA — PONTUAÇÃO DOBRADA!</span>
          <span>⚡</span>
        </motion.div>
      )}

      {/* Question box */}
      <div style={{
        backgroundColor: '#0A0A0A',
        border: '3px solid #0A0A0A',
        boxShadow: '6px 6px 0 #0A0A0A',
        borderRadius: '2px',
        padding: '28px 32px',
        color: '#FFFFFF',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: '22px',
        lineHeight: 1.45,
        textAlign: 'center',
      }}>
        {question.question_text || (question as any).text}
      </div>

      {/* Options grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
      }}>
        {options.map((option, idx) => {
          const label = OPTION_LABELS[idx];
          const bg = OPTION_COLORS[idx] ?? '#FFFFFF';
          const textColor = OPTION_TEXT_COLORS[idx] ?? '#0A0A0A';
          const isCorrect = revealed && correctAnswer && label === correctAnswer;

          return (
            <motion.div
              key={idx}
              animate={
                revealed
                  ? isCorrect
                    ? { scale: 1.03 }
                    : { opacity: 0.45 }
                  : { scale: 1, opacity: 1 }
              }
              transition={{ duration: 0.35 }}
              style={{
                backgroundColor: bg,
                border: `3px solid #0A0A0A`,
                boxShadow: isCorrect ? '8px 8px 0 #00C851' : '6px 6px 0 #0A0A0A',
                borderRadius: '2px',
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                cursor: 'default',
                position: 'relative',
              }}
            >
              {/* Option letter */}
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 900,
                fontSize: '32px',
                color: textColor,
                lineHeight: 1,
                flexShrink: 0,
                width: '40px',
                textAlign: 'center',
                border: '3px solid ' + (idx === 0 ? '#0A0A0A' : 'rgba(255,255,255,0.6)'),
                borderRadius: '2px',
                padding: '0 4px',
                backgroundColor: 'rgba(0,0,0,0.1)',
              }}>
                {label}
              </div>
              {/* Option text */}
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: '15px',
                color: textColor,
                lineHeight: 1.35,
                flex: 1,
              }}>
                {option}
              </div>
              {/* Correct indicator */}
              {isCorrect && (
                <div style={{
                  position: 'absolute',
                  top: '-14px',
                  right: '12px',
                  backgroundColor: '#00C851',
                  color: '#FFFFFF',
                  border: '2px solid #0A0A0A',
                  boxShadow: '2px 2px 0 #0A0A0A',
                  borderRadius: '2px',
                  padding: '2px 10px',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 900,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}>
                  ✓ CORRETA
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default NeoBrutalistQuestionCard;
