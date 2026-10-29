import type { Answer, GameQuestion, ScoreResult, Team } from '../types';

export type AnswerChoice = 'A' | 'B' | 'C' | 'D' | '-';

export interface ScoreInput {
  correct: boolean;
  answered?: boolean;
  basePoints: number;
  previousCorrect: number;
  previousWrong: number;
  firstRank?: number;
  currentScore: number;
}

// Imported older values are normalized so a single question cannot decide the game.
export function questionPoints(points: number): number {
  return points >= 150 ? 150 : 100;
}

export function streakBefore(answers: Answer[], teamId: string, questions: GameQuestion[], currentIndex: number) {
  let previousCorrect = 0;
  let previousWrong = 0;
  for (let index = currentIndex - 1; index >= 0; index--) {
    const answer = answers.find((entry) => entry.team_id === teamId && entry.game_question_id === questions[index].id);
    if (!answer) break;
    if (answer.selected_answer === '-') break;
    if (Boolean(answer.correct)) {
      if (previousWrong) break;
      previousCorrect++;
    } else {
      if (previousCorrect) break;
      previousWrong++;
    }
  }
  return { previousCorrect, previousWrong };
}

export function calculateScore(input: ScoreInput): ScoreResult {
  const { correct, previousCorrect, previousWrong, firstRank, currentScore } = input;
  if (input.answered === false) return { baseScore: 0, speedBonus: 0, orderBonus: 0, recoveryBonus: 0, streakBonus: 0, specialBonus: 0, penalty: 0, totalScore: 0 };
  const baseScore = correct ? questionPoints(input.basePoints) : 0;
  const orderBonus = correct && firstRank && firstRank <= 3 ? [30, 20, 10][firstRank - 1] : 0;
  const streakBonus = correct && (previousCorrect + 1) % 3 === 0 ? 50 : 0;
  const recoveryBonus = correct && previousWrong >= 2 ? 20 : 0;
  const penalty = !correct && (previousWrong + 1) % 3 === 0 ? Math.min(30, Math.max(0, currentScore)) : 0;
  return {
    baseScore,
    speedBonus: 0,
    orderBonus,
    recoveryBonus,
    streakBonus,
    specialBonus: 0,
    penalty,
    totalScore: baseScore + orderBonus + recoveryBonus + streakBonus - penalty,
  };
}

export function competitionRank(teams: Team[], team: Team): number {
  return 1 + teams.filter((other) => (other.score ?? 0) > (team.score ?? 0)).length;
}
