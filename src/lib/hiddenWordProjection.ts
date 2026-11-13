import { hiddenWordRanking, splitHiddenQuestion, type HiddenWordMatch, type HiddenWordRound } from '@/engine/hiddenWord'

export type HiddenWordRankedGroup = ReturnType<typeof hiddenWordRanking>[number]

export function projectHiddenWordRound(round: HiddenWordRound) {
  const revealedPositions = new Set(round.revealedPositions)
  const parts = splitHiddenQuestion(round.question).parts.map(({ text, position, masked }) => {
    const revealed = position !== null && revealedPositions.has(position)
    return { position, revealed, text: position === null || revealed ? text : masked }
  })
  return round.answerVisible ? { parts, answer: round.answer } : { parts }
}

export type ProjectedHiddenWordRound = ReturnType<typeof projectHiddenWordRound>

export type HiddenWordProjection =
  | { phase: 'waiting' }
  | { phase: 'round'; number: number; round: ProjectedHiddenWordRound }
  | { phase: 'results'; ranking: HiddenWordRankedGroup[] }

export function projectHiddenWordMatch(match: HiddenWordMatch | null): HiddenWordProjection {
  if (match?.phase === 'round') {
    return {
      phase: 'round',
      number: match.roundIndex + 1,
      round: projectHiddenWordRound(match.rounds[match.roundIndex]),
    }
  }
  if (match?.phase === 'results') {
    return { phase: 'results', ranking: hiddenWordRanking(match) }
  }
  return { phase: 'waiting' }
}

export const hiddenWordProjectionPath = '/game/hidden-word/projection'

export function projectionTargetOrigin() {
  // File pages in the desktop app have opaque origins. Check both the window and session ID.
  return window.location.protocol === 'file:' ? '*' : window.location.origin
}
