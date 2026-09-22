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

export type GameMode = 'classic' | 'race' | 'strategy' | 'chaos' | 'team' | 'speed' | 'practice' | 'rpg';

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
  // RPG Specific Settings
  mapId?: string;
  rpgVictoryCondition?: 'hybrid' | 'first_to_finish' | 'highest_xp';
  xpPerTile?: number;
  eventsEnabled?: boolean;
  abilitiesEnabled?: boolean;
  bossEnabled?: boolean;
  minXpForVictory?: number;
}

// ─── RPG Game Types ───────────────────────────────────────────────────────

export type RPGTileType =
  | 'start'
  | 'normal'
  | 'turbo'
  | 'treasure'
  | 'shield'
  | 'portal'
  | 'battle'
  | 'boss'
  | 'shortcut'
  | 'comeback'
  | 'castle';

export interface RPGTile {
  id: string;
  index: number;
  type: RPGTileType;
  label: string;
  icon: string;
  x: number; // percentage 0 - 100 for responsive SVG / canvas layout
  y: number; // percentage 0 - 100
  color?: string;
  description: string;
  effectLabel?: string;
  bonusMovement?: number;
  bonusXp?: number;
  nextIndices?: number[];
  branchLabel?: string;
}

export interface RPGMap {
  id: string;
  name: string;
  description: string;
  theme: string;
  tiles: RPGTile[];
  totalTiles: number;
  bossIndices: number[];
  castleIndex: number;
}

export interface RPGAbility {
  id: string;
  type: 'shield' | 'turbo' | 'precision' | 'portal';
  name: string;
  icon: string;
  description: string;
  used: boolean;
}

export interface RPGTeamState {
  teamId: string;
  currentTileIndex: number;
  pathHistory: number[];
  xp: number;
  totalMovement: number;
  overtakesCount: number;
  correctAnswers: number;
  wrongAnswers: number;
  streak: number;
  maxStreak: number;
  abilities: RPGAbility[];
  resources: {
    gems: number;
    shields: number;
    turbos: number;
  };
  level: number;
  title: string;
}

export interface RPGCampaignProfile {
  id: string;
  name: string;
  emoji: string;
  color: string;
  totalXp: number;
  level: number;
  title: string;
  victories: number;
  matchesPlayed: number;
  correctAnswers: number;
  totalQuestions: number;
  highestStreak: number;
  overtakes: number;
  tilesTraveled: number;
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
