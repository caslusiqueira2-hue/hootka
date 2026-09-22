import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { api } from '@/lib/api';
import { calculateScore } from '@/engine/scoring';
import soundEngine from '@/utils/soundEngine';
import NeoBrutalistButton from '@/components/ui/NeoBrutalistButton';
import NeoBrutalistCard from '@/components/ui/NeoBrutalistCard';

export const AnswerRegistration: React.FC = () => {
  const { id: gameId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const active = useGameStore((s) => s.active);
  const { game, teams, questions, currentQuestionIndex } = active;

  const currentQuestion = questions[currentQuestionIndex];
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Read elapsed time
  const elapsed = Number(localStorage.getItem(`hootka_elapsed_${gameId}`) || '10');

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
        soundEngine.playCorrect();
      }
      return next;
    });
  };

  // Keyboard numbers 1-9 to toggle teams
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= teams.length) {
        e.preventDefault();
        toggleTeam(teams[num - 1].id);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleConfirm = async () => {
    if (!game || !currentQuestion || isSubmitting) return;

    setIsSubmitting(true);
    soundEngine.playReveal();

    try {
      const leaderScore = Math.max(...teams.map((t) => t.score ?? 0), 0);
      const totalTime = currentQuestion.time_seconds || 30;

      const scoreBreakdowns: Record<string, any> = {};
      const answerPayload = teams.map((team) => {
        const correct = selectedTeamIds.has(team.id);
        const result = calculateScore({
          correct,
          basePoints: currentQuestion.base_points || 100,
          elapsedTime: elapsed,
          totalTime,
          gapToLeader: Math.max(0, leaderScore - (team.score ?? 0)),
          streak: team.streak ?? 0,
          isSpecial: Boolean(currentQuestion.is_special),
          isWildcard: Boolean(currentQuestion.is_wildcard),
          streakEnabled: game.settings.streakEnabled,
          recoveryBonusEnabled: game.settings.recoveryBonusEnabled,
        });

        scoreBreakdowns[team.id] = { ...result, correct };

        return {
          game_id: game.id,
          game_question_id: currentQuestion.id,
          team_id: team.id,
          correct: correct ? 1 : 0,
          elapsed_time: elapsed,
          base_score: result.baseScore,
          speed_bonus: result.speedBonus,
          recovery_bonus: result.recoveryBonus,
          streak_bonus: result.streakBonus,
          special_bonus: result.specialBonus,
          total_score: result.totalScore,
        };
      });

      // Save to SQLite / backend
      await api.answer.saveAnswers(answerPayload as any);

      // Store breakdown in localStorage for ScoreAnimation screen
      localStorage.setItem(`hootka_scores_${game.id}`, JSON.stringify(scoreBreakdowns));

      // Update team scores in memory
      const updatedTeams = teams.map((t) => {
        const bd = scoreBreakdowns[t.id];
        return {
          ...t,
          score: (t.score ?? 0) + (bd?.totalScore ?? 0),
          streak: bd?.correct ? (t.streak ?? 0) + 1 : 0,
        };
      });

      useGameStore.setState((s) => ({
        active: {
          ...s.active,
          teams: updatedTeams,
        },
      }));

      // Navigate to score reveal screen
      navigate(`/game/${game.id}/score`);
    } catch (err: any) {
      alert('Erro ao salvar resultados: ' + err.message);
      setIsSubmitting(false);
    }
  };

  if (!currentQuestion) {
    return null;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 900,
            fontSize: '3rem',
            margin: '0 0 0.5rem',
            textTransform: 'uppercase',
          }}
        >
          QUEM ACERTOU?
        </h1>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1rem',
            background: '#00C851',
            color: '#FFFFFF',
            border: '3px solid #0A0A0A',
            boxShadow: '4px 4px 0 #0A0A0A',
            padding: '0.6rem 1.5rem',
            fontSize: '1.25rem',
            fontWeight: 900,
            fontFamily: 'var(--font-heading)',
          }}
        >
          <span>RESPOSTA CORRETA:</span>
          <span
            style={{
              background: '#0A0A0A',
              color: '#FFFFFF',
              padding: '0.2rem 0.8rem',
              fontSize: '1.5rem',
            }}
          >
            {currentQuestion.correct_answer}
          </span>
        </div>

        <p style={{ color: '#555', fontWeight: 600, marginTop: '0.75rem', fontSize: '0.95rem' }}>
          Observe os cards levantados pelos grupos e marque abaixo quem acertou. (Use as teclas 1, 2, 3...)
        </p>
      </div>

      {/* Teams Checkbox Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
        {teams.map((team, idx) => {
          const isSelected = selectedTeamIds.has(team.id);

          return (
            <motion.div
              key={team.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => toggleTeam(team.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem 2rem',
                border: isSelected ? '4px solid #0A0A0A' : '3px solid #0A0A0A',
                background: isSelected ? '#FFD600' : '#FFFFFF',
                boxShadow: isSelected ? '6px 6px 0 #0A0A0A' : '4px 4px 0 #0A0A0A',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'background 0.1s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {/* Keyboard badge */}
                <span
                  style={{
                    width: '32px',
                    height: '32px',
                    border: '2px solid #0A0A0A',
                    background: '#F5F0E8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.1rem',
                  }}
                >
                  {idx + 1}
                </span>

                <span style={{ fontSize: '2.5rem' }}>{team.emoji}</span>

                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 900,
                      fontSize: '1.5rem',
                      margin: 0,
                      color: '#0A0A0A',
                    }}
                  >
                    {team.name}
                  </h3>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#555' }}>
                    Pontuação atual: {team.score ?? 0} pts
                  </span>
                </div>
              </div>

              {/* Big Neo-Brutalist Checkbox */}
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  border: '3px solid #0A0A0A',
                  background: isSelected ? '#00C851' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: '1.75rem',
                  boxShadow: '3px 3px 0 #0A0A0A',
                }}
              >
                {isSelected ? '✓' : ''}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Confirmation Button */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <NeoBrutalistButton variant="ghost" size="lg" onClick={() => navigate(`/game/${gameId}/question`)}>
          ← DESFAZER / VOLTAR
        </NeoBrutalistButton>

        <NeoBrutalistButton
          variant="primary"
          size="xl"
          onClick={handleConfirm}
          disabled={isSubmitting}
          style={{ minWidth: '320px', fontSize: '1.35rem' }}
        >
          {isSubmitting ? 'CALCULANDO...' : 'CONFIRMAR RESULTADO → (Enter)'}
        </NeoBrutalistButton>
      </div>
    </div>
  );
};

export default AnswerRegistration;
