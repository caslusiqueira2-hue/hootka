// ============================================================
// hootka – Core TypeScript Types
// ============================================================

export interface Quiz {
  id: string;
  name: string;
  description?: string;
  subject?: string;
  grade?: string;
  theme?: string;
  created_at?: string;
  updated_at?: string;
  question_count?: number;
}

export interface Question {
  id: string;
  quiz_id: string;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  time_seconds: number;
  base_points: number;
  is_special: boolean | number;
  is_wildcard: boolean | number;
  order_index?: number;
}

export interface Team {
  id: string;
  game_id?: string;
  name: string;
  emoji: string;
  color: string;
  identifier?: string;
  order_index?: number;
  score?: number;
  streak?: number;
  position?: number;
  previousPosition?: number;
}

export type GameState =
  | 'lobby'
  | 'question'
  | 'answer_registration'
  | 'calculating_score'
  | 'score_reveal'
  | 'ranking_animation'
  | 'next_question'
  | 'final_reveal'
  | 'finished';

export type GameMode = 'classic' | 'race' | 'strategy' | 'chaos' | 'team' | 'speed' | 'practice';

export interface GameSettings {
  mode?: GameMode;
  defaultTime?: number;
  defaultQuestionTime?: number;
  dynamicScoring: boolean;
  streakEnabled: boolean;
  recoveryBonusEnabled: boolean;
  animationsEnabled: boolean;
  soundEnabled: boolean;
  showRankingAfterQuestion: boolean;
  specialQuestionsEnabled: boolean;
}

export interface Game {
  id: string;
  quiz_id: string;
  quiz_name: string;
  mode: GameMode;
  state: GameState;
  current_question_index: number;
  settings: GameSettings;
  started_at?: string;
  finished_at?: string | null;
  duration_seconds?: number | null;
  teams?: Team[];
  questions?: GameQuestion[];
}

export interface GameQuestion {
  id: string;
  game_id?: string;
  question_id?: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  time_seconds: number;
  base_points: number;
  is_special: boolean | number;
  is_wildcard: boolean | number;
  order_index?: number;
}

export interface Answer {
  id?: string;
  game_id: string;
  game_question_id: string;
  team_id: string;
  correct: boolean | number;
  elapsed_time: number;
  base_score: number;
  speed_bonus: number;
  recovery_bonus: number;
  streak_bonus: number;
  special_bonus: number;
  total_score: number;
  created_at?: string;
}

export interface ScoreResult {
  baseScore: number;
  speedBonus: number;
  recoveryBonus: number;
  streakBonus: number;
  specialBonus: number;
  totalScore: number;
}

export interface TeamScore {
  teamId: string;
  teamName: string;
  teamEmoji: string;
  teamColor: string;
  totalScore: number;
  position: number;
  previousPosition: number;
  scoreResult?: ScoreResult;
}

export interface OvertakeEvent {
  team: Team;
  fromPosition: number;
  toPosition: number;
  overtakenTeam?: Team;
}

export interface AppSettings {
  soundEnabled: boolean;
  animationsEnabled: boolean;
  theme?: string;
  defaultQuestionTime?: number;
}
