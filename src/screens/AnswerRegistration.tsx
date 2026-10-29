import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '@/stores/gameStore';
import { api } from '@/lib/api';
import { AnswerChoice, calculateScore, questionPoints, streakBefore } from '@/engine/scoring';
import type { Answer } from '@/types';
import soundEngine from '@/utils/soundEngine';
import NeoBrutalistButton from '@/components/ui/NeoBrutalistButton';

const CHOICES: AnswerChoice[] = ['A', 'B', 'C', 'D', '-'];

export const AnswerRegistration: React.FC = () => {
  const { id: gameId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const active = useGameStore((state) => state.active);
  const { game, teams, questions, currentQuestionIndex } = active;
  const question = questions[currentQuestionIndex];
  const [choices, setChoices] = useState<Record<string, AnswerChoice>>({});
  const [firstThree, setFirstThree] = useState<string[]>([]);
  const [history, setHistory] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const orderKey = `hootka_first_${gameId}_${question?.id}`;
  const choiceKey = `hootka_choices_${gameId}_${question?.id}`;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    if (!gameId || !question) return;
    api.answer.getByGame(gameId).then((answers) => {
      if (!mounted) return;
      setHistory(answers);
      const stored = JSON.parse(localStorage.getItem(choiceKey) || '{}') as Record<string, AnswerChoice>;
      const restored = { ...stored };
      answers.filter((answer) => answer.game_question_id === question.id).forEach((answer) => {
        if (!restored[answer.team_id] && answer.selected_answer) restored[answer.team_id] = answer.selected_answer;
      });
      setChoices(restored);
      try { setFirstThree(JSON.parse(localStorage.getItem(orderKey) || '[]')); } catch { setFirstThree([]); }
      setLoading(false);
    }).catch(() => { if (mounted) { setError('Não foi possível carregar as respostas.'); setLoading(false); } });
    return () => { mounted = false; };
  }, [gameId, question?.id]);

  if (!question || !game) return <div style={{ padding: '2rem' }}>Partida não encontrada.</div>;

  const setChoice = (teamId: string, choice: AnswerChoice) => {
    setChoices((previous) => ({ ...previous, [teamId]: choice }));
    setError('');
  };

  const markFirst = (teamId: string) => {
    setFirstThree((previous) => {
      const next = previous.includes(teamId) ? previous.filter((id) => id !== teamId) : previous.length < 3 ? [...previous, teamId] : previous;
      localStorage.setItem(orderKey, JSON.stringify(next));
      return next;
    });
  };

  const calculateForTeam = (teamId: string) => {
    const team = teams.find((entry) => entry.id === teamId)!;
    const old = history.find((answer) => answer.game_question_id === question.id && answer.team_id === teamId);
    const beforeScore = Math.max(0, (team.score ?? 0) - (old?.total_score ?? 0));
    const previous = streakBefore(history, teamId, questions, currentQuestionIndex);
    const choice = choices[teamId];
    const correct = choice === question.correct_answer;
    return { beforeScore, previous, correct, result: calculateScore({
      correct,
      answered: choice !== '-',
      basePoints: question.base_points,
      ...previous,
      firstRank: firstThree.indexOf(teamId) + 1 || undefined,
      currentScore: beforeScore,
    }) };
  };

  const complete = teams.length > 0 && teams.every((team) => CHOICES.includes(choices[team.id]));

  const handleConfirm = async () => {
    if (!complete || submitting) { setError('Marque a letra ou “Sem resposta” para cada equipe.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const breakdowns: Record<string, any> = {};
      const answers: Answer[] = teams.map((team) => {
        const { beforeScore, previous, correct, result } = calculateForTeam(team.id);
        breakdowns[team.id] = { ...result, correct, selectedAnswer: choices[team.id], beforeScore };
        return {
          game_id: game.id,
          game_question_id: question.id,
          team_id: team.id,
          correct,
          selected_answer: choices[team.id],
          answer_order: firstThree.indexOf(team.id) >= 0 ? firstThree.indexOf(team.id) + 1 : null,
          elapsed_time: 0,
          base_score: result.baseScore,
          speed_bonus: 0,
          order_bonus: result.orderBonus,
          recovery_bonus: result.recoveryBonus,
          streak_bonus: result.streakBonus,
          special_bonus: 0,
          penalty: result.penalty,
          total_score: result.totalScore,
        };
      });
      await api.answer.saveAnswers(answers);
      localStorage.setItem(choiceKey, JSON.stringify(choices));
      localStorage.setItem(`hootka_scores_${game.id}`, JSON.stringify(breakdowns));
      const updatedTeams = teams.map((team) => {
        const answer = answers.find((entry) => entry.team_id === team.id)!;
        const { beforeScore, previous } = calculateForTeam(team.id);
        return { ...team, score: Math.max(0, beforeScore + answer.total_score), streak: answer.correct ? previous.previousCorrect + 1 : 0 };
      });
      useGameStore.setState((state) => ({ active: { ...state.active, teams: updatedTeams } }));
      await api.game.updateState(game.id, 'score_reveal', { teams: updatedTeams, current_question_index: currentQuestionIndex });
      soundEngine.playReveal();
      navigate(`/game/${game.id}/score`);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível salvar o resultado.');
    } finally {
      setSubmitting(false);
    }
  };

  return <div style={{ padding: '1.5rem', maxWidth: '1050px', margin: '0 auto' }}>
    <h1 style={{ fontSize: '2.3rem', marginBottom: '0.3rem' }}>REGISTRAR PLAQUINHAS</h1>
    <p style={{ fontWeight: 700 }}>Gabarito: <strong>{complete ? question.correct_answer : 'após registrar todas as equipes'}</strong> · Acerto: {questionPoints(question.base_points)} pontos. Marque a letra que cada equipe levantou; o resultado é calculado automaticamente.</p>
    <p style={{ marginTop: 0 }}>Os três primeiros têm bônus de 30, 20 e 10 apenas se acertarem. Toque no marcador para corrigir a ordem.</p>
    {loading ? <p>Carregando respostas...</p> : teams.map((team) => {
      const choice = choices[team.id];
      const rank = firstThree.indexOf(team.id) + 1;
      const preview = complete ? calculateForTeam(team.id).result : null;
      return <div key={team.id} style={{ background: '#FFFFFF', border: '3px solid #0A0A0A', boxShadow: '3px 3px 0 #0A0A0A', padding: '0.8rem 1rem', marginBottom: '0.8rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
          <strong style={{ fontSize: '1.2rem', marginRight: 'auto' }}>{team.emoji} {team.name}</strong>
          <button type="button" onClick={() => markFirst(team.id)} style={{ background: rank ? '#FFD600' : '#F5F0E8', border: '2px solid #0A0A0A', padding: '0.4rem', fontWeight: 800 }}>
            {rank ? `${rank}º A RESPONDER` : 'MARCAR ENTRE OS 3 PRIMEIROS'}
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          {CHOICES.map((letter) => <button type="button" key={letter} onClick={() => setChoice(team.id, letter)} aria-pressed={choice === letter} style={{ border: '2px solid #0A0A0A', background: choice === letter ? '#FFD600' : '#F5F0E8', padding: '0.55rem 0.9rem', fontWeight: 900, cursor: 'pointer' }}>
            {letter === '-' ? 'SEM RESPOSTA' : letter}
          </button>)}
          <span style={{ marginLeft: 'auto', fontWeight: 900, color: preview?.totalScore && preview.totalScore < 0 ? '#B00020' : '#0A0A0A' }}>
            {preview ? `${preview.totalScore >= 0 ? '+' : ''}${preview.totalScore} pts` : 'PENDENTE'}
          </span>
        </div>
        {preview && <small style={{ display: 'block', marginTop: '0.5rem' }}>
          {choice === '-' ? 'Sem resposta ' : preview.baseScore ? `Acerto +${preview.baseScore} ` : 'Erro '}
          {preview.orderBonus ? `· ordem +${preview.orderBonus} ` : ''}
          {preview.streakBonus ? `· 3 acertos +${preview.streakBonus} ` : ''}
          {preview.recoveryBonus ? `· recuperação +${preview.recoveryBonus} ` : ''}
          {preview.penalty ? `· 3 erros −${preview.penalty}` : ''}
        </small>}
      </div>;
    })}
    {error && <p role="alert" style={{ color: '#B00020', fontWeight: 800 }}>{error}</p>}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1.5rem' }}>
      <NeoBrutalistButton variant="ghost" size="lg" onClick={() => navigate(`/game/${gameId}/question`)}>← VOLTAR À QUESTÃO</NeoBrutalistButton>
      <NeoBrutalistButton variant="primary" size="lg" onClick={handleConfirm} disabled={!complete || submitting || loading}>
        {submitting ? 'SALVANDO...' : 'CONFIRMAR RESULTADO →'}
      </NeoBrutalistButton>
    </div>
  </div>;
};

export default AnswerRegistration;
