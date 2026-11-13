export interface HiddenWordGroup {
  id: string
  name: string
}

export interface HiddenWordRound {
  question: string
  answer: string
  revealed: number
}

export interface HiddenWordAward {
  id: string
  groupId: string
  roundIndex: number
  points: number
}

export interface HiddenWordMatch {
  version: 1
  phase: 'groups' | 'compose' | 'round' | 'results'
  groups: HiddenWordGroup[]
  rounds: HiddenWordRound[]
  roundIndex: number
  awards: HiddenWordAward[]
}

export function createHiddenWordMatch(): HiddenWordMatch {
  return { version: 1, phase: 'groups', groups: [], rounds: [], roundIndex: 0, awards: [] }
}

interface AnswerPart {
  text: string
  wordIndex: number | null
  masked: string
}

// Treat accents attached to a letter as part of the same slot, including decomposed input.
// Hyphens and apostrophes stay visible within the same whitespace-delimited word.
export function splitHiddenAnswer(answer: string) {
  let wordCount = 0
  const parts: AnswerPart[] = (answer.match(/\s+|\S+/gu) ?? []).map((text) => {
    const masked = text.replace(/[\p{L}\p{N}]\p{M}*/gu, '_')
    const wordIndex = masked === text ? null : wordCount++
    return { text, wordIndex, masked }
  })
  return { parts, wordCount }
}

export function hiddenWordRanking(match: HiddenWordMatch) {
  const scores = new Map<string, number>()
  for (const { groupId, points } of match.awards) {
    scores.set(groupId, (scores.get(groupId) ?? 0) + points)
  }
  const ordered = match.groups
    .map((group) => ({ ...group, score: scores.get(group.id) ?? 0 }))
    .sort((a, b) => b.score - a.score)
  let place = 0
  return ordered.map((group, index) => {
    if (group.score !== ordered[index - 1]?.score) place = index + 1
    return { ...group, place }
  })
}

export type HiddenWordAction =
  | { type: 'saveGroup'; id: string; name: string }
  | { type: 'removeGroup'; id: string }
  | { type: 'compose' }
  | { type: 'addRound'; question: string; answer: string }
  | { type: 'reveal'; count: number }
  | { type: 'previous' | 'next' | 'finish' | 'newMatch' }
  | { type: 'award'; id: string; groupId: string; points: number }
  | { type: 'correct'; id: string; points: number }

export function updateHiddenWordMatch(match: HiddenWordMatch, action: HiddenWordAction): HiddenWordMatch {
  const { phase, roundIndex, rounds } = match
  switch (action.type) {
    case 'saveGroup': {
      const name = action.name.trim()
      if (phase !== 'groups' || !name) return match
      const { id } = action
      const groups = match.groups.some((group) => group.id === id)
        ? match.groups.map((group) => group.id === id ? { id, name } : group)
        : [...match.groups, { id, name }]
      return { ...match, groups }
    }
    case 'removeGroup':
      if (phase !== 'groups') return match
      return { ...match, groups: match.groups.filter((group) => group.id !== action.id) }
    case 'compose':
      return phase === 'groups' && match.groups.length > 0 ? { ...match, phase: 'compose' } : match
    case 'addRound': {
      const question = action.question.trim()
      if (phase !== 'compose' || !question || !splitHiddenAnswer(action.answer).wordCount) return match
      return {
        ...match,
        phase: 'round',
        roundIndex: rounds.length,
        rounds: [...rounds, { question, answer: action.answer, revealed: 0 }],
      }
    }
    case 'reveal': {
      if (phase !== 'round' || !Number.isSafeInteger(action.count)) return match
      const round = rounds[roundIndex]
      const revealed = Math.min(Math.max(0, action.count), splitHiddenAnswer(round.answer).wordCount)
      if (revealed === round.revealed) return match
      return {
        ...match,
        rounds: rounds.map((item, index) => index === roundIndex ? { ...item, revealed } : item),
      }
    }
    case 'previous':
      if (phase === 'compose') {
        return rounds.length
          ? { ...match, phase: 'round', roundIndex: rounds.length - 1 }
          : { ...match, phase: 'groups' }
      }
      return phase === 'round' && roundIndex > 0 ? { ...match, roundIndex: roundIndex - 1 } : match
    case 'next':
      if (phase !== 'round') return match
      return roundIndex + 1 < rounds.length
        ? { ...match, roundIndex: roundIndex + 1 }
        : { ...match, phase: 'compose' }
    case 'award': {
      const { id, groupId, points } = action
      if (phase !== 'round' || !Number.isSafeInteger(points) || points < 1) return match
      const group = hiddenWordRanking(match).find((entry) => entry.id === groupId)
      if (!group || !Number.isSafeInteger(group.score + points)) return match
      return { ...match, awards: [...match.awards, { id, groupId, points, roundIndex }] }
    }
    case 'correct': {
      const { id, points } = action
      const award = match.awards.find((entry) => entry.id === id)
      if ((phase !== 'round' && phase !== 'compose') || !award || !Number.isSafeInteger(points) || points < 0) {
        return match
      }
      const group = hiddenWordRanking(match).find((entry) => entry.id === award.groupId)
      if (!group || !Number.isSafeInteger(group.score - award.points + points)) return match
      const awards = points === 0
        ? match.awards.filter((entry) => entry.id !== id)
        : match.awards.map((entry) => entry.id === id ? { ...entry, points } : entry)
      return { ...match, awards }
    }
    case 'finish':
      return rounds.length && (phase === 'round' || phase === 'compose') ? { ...match, phase: 'results' } : match
    case 'newMatch':
      return phase === 'results' ? createHiddenWordMatch() : match
  }
}
