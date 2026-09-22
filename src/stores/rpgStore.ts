/**
 * rpgStore.ts - Zustand Store for Hootka RPG: O Reino do Conhecimento
 * 
 * Manages:
 * - Active map and tile state
 * - Team board positions, inventory & abilities
 * - Movement animation sequencing
 * - Landing event resolution & Boss encounters
 * - Overtakes detection on the board
 * - Local campaign persistence
 */

import { create } from 'zustand';
import type {
  Team,
  RPGTile,
  RPGMap,
  RPGTeamState,
  OvertakeEvent,
  RPGCampaignProfile,
} from '@/types';
import {
  FOREST_OF_KNOWLEDGE_MAP,
  AVAILABLE_MAPS,
  createInitialTeamState,
  calculateMovement,
  resolveTileLanding,
  TileResolution,
  detectBoardOvertakes,
  calculateCampaignTitle,
} from '@/engine/rpgEngine';

interface RPGStoreState {
  currentMap: RPGMap;
  teamStates: Record<string, RPGTeamState>;
  isAnimating: boolean;
  activeResolution: TileResolution | null;
  activeResolutionTeam: Team | null;
  overtakeAlerts: OvertakeEvent[];
  isBossActive: boolean;
  victoryAchieved: { isOver: boolean; winner?: Team; reason?: string } | null;

  // Actions
  initRPGGame: (teams: Team[], mapId?: string) => void;
  setMap: (mapId: string) => void;
  processRoundResults: (
    teams: Team[],
    scoreBreakdowns: Record<string, any>
  ) => {
    overtakes: OvertakeEvent[];
    resolutions: { team: Team; resolution: TileResolution }[];
  };
  dismissResolution: () => void;
  useAbility: (teamId: string, abilityId: string) => boolean;
  setBossActive: (active: boolean) => void;
  resetRPG: () => void;
  saveCampaignResults: (teams: Team[]) => void;
  getCampaignProfile: (teamName: string) => RPGCampaignProfile | null;
}

const CAMPAIGN_STORAGE_KEY = 'hootka_rpg_campaign_profiles';

export const useRPGStore = create<RPGStoreState>((set, get) => ({
  currentMap: FOREST_OF_KNOWLEDGE_MAP,
  teamStates: {},
  isAnimating: false,
  activeResolution: null,
  activeResolutionTeam: null,
  overtakeAlerts: [],
  isBossActive: false,
  victoryAchieved: null,

  initRPGGame: (teams, mapId) => {
    const map = AVAILABLE_MAPS.find((m) => m.id === mapId) || FOREST_OF_KNOWLEDGE_MAP;
    const initialStates: Record<string, RPGTeamState> = {};

    teams.forEach((t) => {
      initialStates[t.id] = createInitialTeamState(t.id);
    });

    set({
      currentMap: map,
      teamStates: initialStates,
      isAnimating: false,
      activeResolution: null,
      activeResolutionTeam: null,
      overtakeAlerts: [],
      isBossActive: false,
      victoryAchieved: null,
    });
  },

  setMap: (mapId) => {
    const map = AVAILABLE_MAPS.find((m) => m.id === mapId) || FOREST_OF_KNOWLEDGE_MAP;
    set({ currentMap: map });
  },

  processRoundResults: (teams, scoreBreakdowns) => {
    const { currentMap, teamStates } = get();
    const updatedStates: Record<string, RPGTeamState> = { ...teamStates };
    const resolutions: { team: Team; resolution: TileResolution }[] = [];

    // 1. Process movement and landing for each team
    teams.forEach((team) => {
      const breakdown = scoreBreakdowns[team.id] || { totalScore: 0, correct: false };
      const currentState = updatedStates[team.id] || createInitialTeamState(team.id);

      const hasTurbo = currentState.abilities.some((a) => a.type === 'turbo' && a.used);
      const { movement } = calculateMovement(breakdown.totalScore, hasTurbo);

      const maxTileIndex = currentMap.tiles.length - 1;
      const targetTileIndex = Math.min(currentState.currentTileIndex + movement, maxTileIndex);
      const targetTile = currentMap.tiles[targetTileIndex];

      // Resolve tile effect
      const resolution = resolveTileLanding(targetTile);
      if (movement > 0) {
        resolutions.push({ team, resolution });
      }

      // Bonus movement from portal or turbo tile
      const finalTileIndex = Math.min(targetTileIndex + resolution.bonusMovement, maxTileIndex);

      // Track streak & overtakes
      const newStreak = breakdown.correct ? currentState.streak + 1 : 0;

      updatedStates[team.id] = {
        ...currentState,
        currentTileIndex: finalTileIndex,
        pathHistory: [...currentState.pathHistory, finalTileIndex],
        xp: currentState.xp + breakdown.totalScore + resolution.bonusXp,
        totalMovement: currentState.totalMovement + movement + resolution.bonusMovement,
        correctAnswers: currentState.correctAnswers + (breakdown.correct ? 1 : 0),
        wrongAnswers: currentState.wrongAnswers + (!breakdown.correct ? 1 : 0),
        streak: newStreak,
        maxStreak: Math.max(currentState.maxStreak, newStreak),
      };
    });

    // 2. Detect board overtakes
    const overtakes = detectBoardOvertakes(teams, updatedStates);

    // Update overtakes count in states
    overtakes.forEach((evt) => {
      if (updatedStates[evt.team.id]) {
        updatedStates[evt.team.id].overtakesCount += 1;
      }
    });

    // Check if any team stepped on a Boss tile
    const bossEncounter = Object.values(updatedStates).some(
      (s) => currentMap.bossIndices.includes(s.currentTileIndex)
    );

    set({
      teamStates: updatedStates,
      overtakeAlerts: overtakes,
      isBossActive: bossEncounter,
      activeResolution: resolutions.length > 0 ? resolutions[0].resolution : null,
      activeResolutionTeam: resolutions.length > 0 ? resolutions[0].team : null,
    });

    return { overtakes, resolutions };
  },

  dismissResolution: () => {
    set({ activeResolution: null, activeResolutionTeam: null });
  },

  useAbility: (teamId, abilityId) => {
    const { teamStates } = get();
    const state = teamStates[teamId];
    if (!state) return false;

    const ability = state.abilities.find((a) => a.id === abilityId);
    if (!ability || ability.used) return false;

    const updatedAbilities = state.abilities.map((a) =>
      a.id === abilityId ? { ...a, used: true } : a
    );

    set({
      teamStates: {
        ...teamStates,
        [teamId]: {
          ...state,
          abilities: updatedAbilities,
        },
      },
    });

    return true;
  },

  setBossActive: (active) => set({ isBossActive: active }),

  resetRPG: () => {
    set({
      currentMap: FOREST_OF_KNOWLEDGE_MAP,
      teamStates: {},
      isAnimating: false,
      activeResolution: null,
      activeResolutionTeam: null,
      overtakeAlerts: [],
      isBossActive: false,
      victoryAchieved: null,
    });
  },

  saveCampaignResults: (teams) => {
    const { teamStates } = get();
    try {
      const raw = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
      const profiles: Record<string, RPGCampaignProfile> = raw ? JSON.parse(raw) : {};

      // Determine match winner
      const sorted = [...teams].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
      const winnerId = sorted[0]?.id;

      teams.forEach((t) => {
        const state = teamStates[t.id];
        const key = t.name.trim().toUpperCase();
        const existing = profiles[key] || {
          id: 'camp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          name: t.name,
          emoji: t.emoji,
          color: t.color,
          totalXp: 0,
          level: 1,
          title: 'Aprendiz do Saber',
          victories: 0,
          matchesPlayed: 0,
          correctAnswers: 0,
          totalQuestions: 0,
          highestStreak: 0,
          overtakes: 0,
          tilesTraveled: 0,
        };

        const totalXp = existing.totalXp + (t.score ?? 0);
        const { level, title } = calculateCampaignTitle(totalXp);

        profiles[key] = {
          ...existing,
          totalXp,
          level,
          title,
          victories: existing.victories + (t.id === winnerId ? 1 : 0),
          matchesPlayed: existing.matchesPlayed + 1,
          correctAnswers: existing.correctAnswers + (state?.correctAnswers ?? 0),
          totalQuestions: existing.totalQuestions + (state?.correctAnswers ?? 0) + (state?.wrongAnswers ?? 0),
          highestStreak: Math.max(existing.highestStreak, state?.maxStreak ?? 0),
          overtakes: existing.overtakes + (state?.overtakesCount ?? 0),
          tilesTraveled: existing.tilesTraveled + (state?.totalMovement ?? 0),
        };
      });

      localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.warn('Erro ao salvar dados de campanha:', e);
    }
  },

  getCampaignProfile: (teamName) => {
    try {
      const raw = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
      if (!raw) return null;
      const profiles: Record<string, RPGCampaignProfile> = JSON.parse(raw);
      return profiles[teamName.trim().toUpperCase()] || null;
    } catch {
      return null;
    }
  },
}));
