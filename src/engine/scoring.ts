// ============================================================
// hootka – Scoring Engine
// ============================================================

import type { ScoreResult } from '../types';

/**
 * Speed bonus lookup.
 * `elapsed` = seconds used, `total` = allowed seconds.
 * Earlier answers earn higher bonuses.
 */
export function calculateSpeedBonus(elapsed: number, total: number): number {
  if (total <= 0) return 0;
  const ratio = Math.max(0, Math.min(1, elapsed / total));
  if (ratio <= 0.16) return 100;
  if (ratio <= 0.33) return 80;
  if (ratio <= 0.50) return 60;
  if (ratio <= 0.66) return 40;
  if (ratio <= 0.83) return 20;
  return 10;
}

/**
 * Recovery bonus based on points gap to the leader.
 * `gap` = leaderScore - thisTeamScore (>= 0).
 */
export function calculateRecoveryBonus(gap: number): number {
  if (gap <= 0)   return 0;
  if (gap <= 100) return 0;
  if (gap <= 250) return 10;
  if (gap <= 400) return 20;
  if (gap <= 600) return 30;
  return 40;
}

/**
 * Streak bonus for consecutive correct answers.
 * `streak` = number of correct answers in a row (including current one).
 */
export function calculateStreakBonus(streak: number): number {
  if (streak < 2) return 0;
  if (streak === 2) return 10;
  if (streak === 3) return 20;
  return 30; // 4+ capped at 30
}

export interface ScoreInput {
  correct: boolean;
  basePoints: number;
  elapsedTime: number;
  totalTime: number;
  gapToLeader: number;
  streak: number;
  isSpecial: boolean;
  isWildcard: boolean;
  streakEnabled?: boolean;
  recoveryBonusEnabled?: boolean;
}

export function calculateScore(input: ScoreInput): ScoreResult {
  const {
    correct,
    basePoints,
    elapsedTime,
    totalTime,
    gapToLeader,
    streak,
    isSpecial,
    isWildcard,
    streakEnabled = true,
    recoveryBonusEnabled = true,
  } = input;

  if (!correct) {
    return { baseScore: 0, speedBonus: 0, recoveryBonus: 0, streakBonus: 0, specialBonus: 0, totalScore: 0 };
  }

  const baseScore     = basePoints;
  const speedBonus    = calculateSpeedBonus(elapsedTime, totalTime);
  const recoveryBonus = recoveryBonusEnabled ? calculateRecoveryBonus(gapToLeader) : 0;
  const streakBonus   = streakEnabled        ? calculateStreakBonus(streak)        : 0;
  const specialBonus  = isSpecial ? Math.round(baseScore * 0.5) : 0;

  let totalScore = baseScore + speedBonus + recoveryBonus + streakBonus + specialBonus;
  if (isWildcard) totalScore = totalScore * 2;

  return { baseScore, speedBonus, recoveryBonus, streakBonus, specialBonus, totalScore };
}

export interface TeamScoreInput  { teamId: number; input: ScoreInput; }
export interface TeamScoreOutput { teamId: number; result: ScoreResult; }

export function calculateScoresForQuestion(teamInputs: TeamScoreInput[]): TeamScoreOutput[] {
  return teamInputs.map(({ teamId, input }) => ({ teamId, result: calculateScore(input) }));
}
