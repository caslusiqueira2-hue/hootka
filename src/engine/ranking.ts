// ============================================================
// hootka – Ranking Engine
// ============================================================

import type { Answer, OvertakeEvent, Team, TeamScore } from '../types';

/**
 * Sort a TeamScore array by score (desc), then stable on previous position.
 * Returns a new array with updated 1-based `position` and `previousPosition`.
 */
export function sortTeamsByScore(teams: TeamScore[]): TeamScore[] {
  const sorted = [...teams].sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return a.position - b.position;
  });

  return sorted.map((team, index) => ({
    ...team,
    previousPosition: team.position,
    position: index + 1,
  }));
}

/**
 * Detect which teams moved UP in the ranking between two snapshots.
 * Returns OvertakeEvent[] sorted by biggest jump first.
 */
export function detectOvertakes(before: TeamScore[], after: TeamScore[]): OvertakeEvent[] {
  const beforeMap = new Map<string, TeamScore>();
  for (const ts of before) beforeMap.set(String(ts.teamId), ts);

  const events: OvertakeEvent[] = [];

  for (const current of after) {
    const previous = beforeMap.get(String(current.teamId));
    if (!previous) continue;

    const fromPosition = previous.position;
    const toPosition   = current.position;

    if (toPosition < fromPosition) {
      const team: Team = {
        id: current.teamId,
        game_id: '0',
        name: current.teamName,
        emoji: current.teamEmoji,
        color: current.teamColor,
        identifier: String(current.teamId),
        order_index: current.position,
        score: current.totalScore,
        position: toPosition,
        previousPosition: fromPosition,
      };
      events.push({ team, fromPosition, toPosition });
    }
  }

  events.sort((a, b) => (b.fromPosition - b.toPosition) - (a.fromPosition - a.toPosition));
  return events;
}

interface AnswerAccumulator {
  totalScore: number;
  correctCount: number;
  totalElapsed: number;
  answerCount: number;
}

/**
 * Aggregate Answer records for each team and return a ranked TeamScore[].
 * Works from pre-computed `total_score` values stored in each Answer row.
 */
export function calculateTeamScores(teams: Team[], answers: Answer[]): TeamScore[] {
  const accumMap = new Map<string, AnswerAccumulator>();
  for (const team of teams) {
    accumMap.set(String(team.id), { totalScore: 0, correctCount: 0, totalElapsed: 0, answerCount: 0 });
  }

  for (const answer of answers) {
    const acc = accumMap.get(String(answer.team_id));
    if (!acc) continue;
    acc.totalScore   += answer.total_score;
    acc.totalElapsed += answer.elapsed_time;
    acc.answerCount  += 1;
    if (answer.correct) acc.correctCount += 1;
  }

  const unsorted: TeamScore[] = teams.map((team) => {
    const acc = accumMap.get(String(team.id)) ?? { totalScore: 0, correctCount: 0, totalElapsed: 0, answerCount: 0 };
    return {
      teamId: team.id,
      teamName: team.name,
      teamEmoji: team.emoji,
      teamColor: team.color,
      totalScore: acc.totalScore,
      position: team.position ?? 0,
      previousPosition: team.previousPosition ?? 0,
    };
  });

  const sorted = [...unsorted].sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    const accA = accumMap.get(String(a.teamId))!;
    const accB = accumMap.get(String(b.teamId))!;
    if (accB.correctCount !== accA.correctCount) return accB.correctCount - accA.correctCount;
    const avgA = accA.answerCount > 0 ? accA.totalElapsed / accA.answerCount : Infinity;
    const avgB = accB.answerCount > 0 ? accB.totalElapsed / accB.answerCount : Infinity;
    return avgA - avgB;
  });

  return sorted.map((ts, index) => ({
    ...ts,
    previousPosition: ts.position === 0 ? index + 1 : ts.position,
    position: index + 1,
  }));
}

/** Positive = team moved up. Negative = team moved down. */
export function getRankingDelta(teamScore: TeamScore): number {
  return teamScore.previousPosition - teamScore.position;
}

/** Returns the highest score from a ranked list (position 1 team). */
export function getLeaderScore(teamScores: TeamScore[]): number {
  if (teamScores.length === 0) return 0;
  return teamScores.find((ts) => ts.position === 1)?.totalScore ?? 0;
}
