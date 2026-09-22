import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { api } from '@/lib/api';
import soundEngine from '@/utils/soundEngine';
import NeoBrutalistButton from '@/components/ui/NeoBrutalistButton';
import NeoBrutalistBadge from '@/components/ui/NeoBrutalistBadge';

export const QuestionScreen: React.FC = () => {
  const { id: gameId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const active = useGameStore((s) => s.active);
  const { game, questions, currentQuestionIndex } = active;

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  const [timeLeft, setTimeLeft] = useState<number>(currentQuestion?.time_seconds || 30);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize timer for current question
  useEffect(() => {
    if (!currentQuestion) return;
    const initialTime = currentQuestion.time_seconds || 30;
    setTimeLeft(initialTime);
    setIsRunning(true);
    setIsRevealed(false);
    setElapsed(0);
    soundEngine.playCountdown();
  }, [currentQuestionIndex, currentQuestion]);

  // Timer interval
  useEffect(() => {
    if (!isRunning || isRevealed) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsRunning(false);
          soundEngine.playWrong();
          return 0;
        }

        const next = prev - 1;
        if (next <= 5) {
          soundEngine.playUrgentTick();
        } else if (next <= 10) {
          soundEngine.playTick();
        }

        return next;
      });

      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isRevealed]);

  const handleTogglePause = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const handleEndTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(0);
    soundEngine.playWrong();
  }, []);

  const handleReveal = useCallback(() => {
    setIsRunning(false);
    setIsRevealed(true);
    soundEngine.playReveal();
  }, []);

  const handleGoToRegistration = useCallback(() => {
    if (!gameId) return;
    // Store elapsed time in localStorage or pass along
    localStorage.setItem(`hootka_elapsed_${gameId}`, String(elapsed));
    navigate(`/game/${gameId}/answers`);
  }, [gameId, elapsed, navigate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePause();
      } else if (e.code === 'ArrowRight' && !isRevealed) {
        e.preventDefault();
        handleEndTimer();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        if (!isRevealed) {
          handleReveal();
        } else {
          handleGoToRegistration();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePause, handleEndTimer, handleReveal, handleGoToRegistration, isRevealed]);

  if (!currentQuestion) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>Nenhuma questão encontrada para este jogo.</h2>
        <NeoBrutalistButton variant="primary" size="md" onClick={() => navigate('/')}>
          VOLTAR AO INÍCIO
        </NeoBrutalistButton>
      </div>
    );
  }

  const isUrgent = timeLeft <= 10 && timeLeft > 0;
  const isTimeUp = timeLeft === 0;

  const options = [
    { letter: 'A', text: currentQuestion.option_a, color: '#FFD600', textColor: '#0A0A0A' },
    { letter: 'B', text: currentQuestion.option_b, color: '#1A1AFF', textColor: '#FFFFFF' },
    { letter: 'C', text: currentQuestion.option_c, color: '#FF3B00', textColor: '#FFFFFF' },
    { letter: 'D', text: currentQuestion.option_d, color: '#00C851', textColor: '#FFFFFF' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '100vh',
        background: 'var(--color-background)',
        padding: '1.5rem 2.5rem',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.75rem', letterSpacing: '0.04em' }}>
              QUESTÃO {String(currentQuestionIndex + 1).padStart(2, '0')} / {String(totalQuestions).padStart(2, '0')}
            </span>
            {Boolean(currentQuestion.is_special) && (
              <NeoBrutalistBadge variant="warning">⭐ ESPECIAL (+50% BÔNUS)</NeoBrutalistBadge>
            )}
            {Boolean(currentQuestion.is_wildcard) && (
              <NeoBrutalistBadge variant="danger">⚡ QUESTÃO DE VIRADA</NeoBrutalistBadge>
            )}
            <NeoBrutalistBadge variant="secondary">{currentQuestion.base_points} PONTOS</NeoBrutalistBadge>
          </div>

          {/* Countdown Clock Neo-Brutalist */}
          <motion.div
            animate={isUrgent ? { scale: [1, 1.08, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.8 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: isUrgent ? '#FF1744' : isTimeUp ? '#0A0A0A' : '#FFFFFF',
              color: isUrgent || isTimeUp ? '#FFFFFF' : '#0A0A0A',
              border: '4px solid #0A0A0A',
              boxShadow: '6px 6px 0 #0A0A0A',
              padding: '0.5rem 1.5rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: 900,
              fontSize: '2rem',
              minWidth: '150px',
              justifyContent: 'center',
            }}
          >
            <span>⏱️</span>
            <span>{String(timeLeft).padStart(2, '0')}s</span>
          </motion.div>
        </div>

        {/* Wildcard Alert Banner */}
        {Boolean(currentQuestion.is_wildcard) && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              background: '#FFD600',
              border: '3px solid #0A0A0A',
              boxShadow: '4px 4px 0 #0A0A0A',
              padding: '0.6rem 1rem',
              textAlign: 'center',
              fontFamily: 'var(--font-heading)',
              fontWeight: 900,
              fontSize: '1.25rem',
              letterSpacing: '0.08em',
              marginBottom: '1rem',
            }}
          >
            ⚡ QUESTÃO DE VIRADA — PONTUAÇÃO DOBRADA PARA QUEM ACERTAR! ⚡
          </motion.div>
        )}
      </div>

      {/* Center: Big Question Box */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          background: '#FFFFFF',
          border: '4px solid #0A0A0A',
          boxShadow: '8px 8px 0 #0A0A0A',
          padding: '2rem 2.5rem',
          margin: '0.5rem 0 1.5rem',
          textAlign: 'center',
          minHeight: '140px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 900,
            fontSize: '2.5rem',
            lineHeight: 1.3,
            color: '#0A0A0A',
            margin: 0,
            letterSpacing: '0.02em',
          }}
        >
          {currentQuestion.question_text || (currentQuestion as any).text}
        </h1>
      </motion.div>

      {/* 2x2 Alternatives Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.25rem',
          marginBottom: '1.5rem',
          flex: 1,
        }}
      >
        {options.map((opt) => {
          const isThisCorrect = isRevealed && currentQuestion.correct_answer === opt.letter;
          const isWrong = isRevealed && currentQuestion.correct_answer !== opt.letter;

          return (
            <motion.div
              key={opt.letter}
              animate={isThisCorrect ? { scale: [1, 1.03, 1] } : isWrong ? { opacity: 0.35 } : { opacity: 1 }}
              transition={isThisCorrect ? { repeat: Infinity, duration: 1.2 } : {}}
              style={{
                background: isThisCorrect ? '#00C851' : opt.color,
                color: isThisCorrect ? '#FFFFFF' : opt.textColor,
                border: isThisCorrect ? '5px solid #0A0A0A' : '4px solid #0A0A0A',
                boxShadow: isThisCorrect ? '8px 8px 0 #0A0A0A' : '6px 6px 0 #0A0A0A',
                padding: '1.5rem 1.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                cursor: 'default',
                userSelect: 'none',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  background: '#0A0A0A',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 900,
                  fontSize: '2rem',
                  flexShrink: 0,
                  boxShadow: '3px 3px 0 #FFFFFF',
                }}
              >
                {opt.letter}
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '1.5rem',
                  lineHeight: 1.25,
                }}
              >
                {opt.text}
              </span>
              {isThisCorrect && (
                <span style={{ marginLeft: 'auto', fontSize: '2rem', fontWeight: 900 }}>
                  ✓
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Teacher Controls Footer */}
      <div
        style={{
          background: '#FFFFFF',
          border: '3px solid #0A0A0A',
          boxShadow: '4px 4px 0 #0A0A0A',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <NeoBrutalistButton variant="ghost" size="sm" onClick={handleTogglePause}>
            {isRunning ? '⏸ PAUSAR (Espaço)' : '▶ CONTINUAR (Espaço)'}
          </NeoBrutalistButton>
          {!isRevealed && (
            <NeoBrutalistButton variant="danger" size="sm" onClick={handleEndTimer}>
              ⏹ ENCERRAR TEMPO (→)
            </NeoBrutalistButton>
          )}
          {!isRevealed && (
            <NeoBrutalistButton variant="accent" size="sm" onClick={handleReveal}>
              👁️ REVELAR RESPOSTA (Enter)
            </NeoBrutalistButton>
          )}
        </div>

        <div>
          {isRevealed && (
            <NeoBrutalistButton
              variant="primary"
              size="md"
              onClick={handleGoToRegistration}
              style={{ fontWeight: 900 }}
            >
              QUEM ACERTOU? REGISTRAR RESPOSTAS → (Enter)
            </NeoBrutalistButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionScreen;
