/**
 * rpgEngine.ts - Core Game Engine for Hootka RPG: O Reino do Conhecimento
 * 
 * Centralizes:
 * - Board maps (Forest of Knowledge with branching coordinates)
 * - XP to Movement conversion
 * - Tile landing resolutions (Turbo, Shield, Portal, Treasure, Boss, Comeback, Castle)
 * - Overtake detection with layout springs
 * - Victory conditions (Hybrid, Highest XP, First to Finish)
 * - Campaign level and title progression
 * - Demo match simulation data
 */

import type {
  Team,
  GameSettings,
  RPGTile,
  RPGMap,
  RPGTeamState,
  RPGAbility,
  RPGCampaignProfile,
  OvertakeEvent,
} from '@/types';

// ─── Map: A Floresta do Saber (30 Casas) ──────────────────────────────────

export const FOREST_TILES: RPGTile[] = [
  { id: 't0', index: 0, type: 'start', label: 'Acampamento Inicial', icon: '🏕️', x: 6, y: 86, description: 'Ponto de partida de todas as equipes no Reino do Conhecimento.', color: '#FFD600' },
  { id: 't1', index: 1, type: 'normal', label: 'Trilha das Folhas', icon: '🍃', x: 15, y: 84, description: 'Caminho calmo sob as copas das árvores centenárias.' },
  { id: 't2', index: 2, type: 'normal', label: 'Riacho Claro', icon: '💧', x: 24, y: 83, description: 'Águas límpidas que revigoram o ânimo dos estudantes.' },
  { id: 't3', index: 3, type: 'turbo', label: 'Vento Veloz', icon: '⚡', x: 33, y: 80, description: 'Corrente de ar que impulsiona o próximo acerto com +1 casa extra!', bonusMovement: 1, color: '#1A1AFF' },
  { id: 't4', index: 4, type: 'normal', label: 'Pedra do Repouso', icon: '🪨', x: 42, y: 77, description: 'Local para respirar e afinar a estratégia do grupo.' },
  { id: 't5', index: 5, type: 'treasure', label: 'Baú dos Sábios', icon: '🎁', x: 51, y: 74, description: 'Encontraram um baú com relíquias pedagógicas (+60 XP)!', bonusXp: 60, color: '#FFD600' },
  { id: 't6', index: 6, type: 'shortcut', label: 'Encruzilhada Antiga', icon: '🔀', x: 61, y: 72, description: 'Ponto de bifurcação estratégica entre a trilha aberta e a fenda mística.', nextIndices: [7, 8] },
  { id: 't7', index: 7, type: 'normal', label: 'Bosque Silencioso', icon: '🌲', x: 71, y: 70, description: 'Trilha principal, segura e com boa visibilidade.' },
  { id: 't8', index: 8, type: 'shield', label: 'Círculo de Proteção', icon: '🛡️', x: 81, y: 64, description: 'Concede uma barreira mágica para defender a colocação da equipe!', color: '#00C851' },
  { id: 't9', index: 9, type: 'portal', label: 'Portal Místico', icon: '🌀', x: 86, y: 52, description: 'Um vórtice arcano que teleporta a equipe +2 casas à frente!', bonusMovement: 2, color: '#9B59B6' },
  { id: 't10', index: 10, type: 'battle', label: 'Arena dos Desafios', icon: '⚔️', x: 77, y: 48, description: 'Zona de confronto acadêmico! Acertos aqui inflam a moral do grupo.' },
  { id: 't11', index: 11, type: 'normal', label: 'Ponte de Madeira', icon: '🪵', x: 67, y: 50, description: 'Travessia sobre o desfiladeiro das grandes ideias.' },
  { id: 't12', index: 12, type: 'comeback', label: 'Chama da Virada', icon: '🔥', x: 57, y: 52, description: 'Área especial para quem vem atrás recuperar terreno (+75 XP)!', bonusXp: 75, color: '#FF3B00' },
  { id: 't13', index: 13, type: 'turbo', label: 'Correnteza Rápida', icon: '⚡', x: 47, y: 50, description: 'Aceleração imediata (+1 casa no próximo avanço).', bonusMovement: 1, color: '#1A1AFF' },
  { id: 't14', index: 14, type: 'treasure', label: 'Gemas Raras', icon: '💎', x: 37, y: 48, description: 'Gemas brilhantes que concedem +80 XP bônus!', bonusXp: 80, color: '#FFD600' },
  { id: 't15', index: 15, type: 'normal', label: 'Gruta dos Ecos', icon: '🦇', x: 27, y: 45, description: 'Caverna sagrada com inscrições de fórmulas e história.' },
  { id: 't16', index: 16, type: 'shield', label: 'Tótem Sagrado', icon: '🛡️', x: 17, y: 40, description: 'Escudo guardião ativado para salvaguardar a pontuação da equipe.', color: '#00C851' },
  { id: 't17', index: 17, type: 'portal', label: 'Fenda Astral', icon: '🌀', x: 14, y: 28, description: 'Ressonância mágica! Salto instantâneo de 2 casas.', bonusMovement: 2, color: '#9B59B6' },
  { id: 't18', index: 18, type: 'battle', label: 'Coliseu das Sombras', icon: '⚔️', x: 24, y: 25, description: 'Rivalidade intensa pelo domínio da rota montanhosa.' },
  { id: 't19', index: 19, type: 'normal', label: 'Colina Alta', icon: '⛰️', x: 35, y: 24, description: 'Visão panorâmica de todo o tabuleiro do reino.' },
  { id: 't20', index: 20, type: 'comeback', label: 'Fogueira Ancestral', icon: '🔥', x: 46, y: 25, description: 'Aquecimento e coragem para virar o placar da partida!', color: '#FF3B00' },
  { id: 't21', index: 21, type: 'turbo', label: 'Tromba de Ar', icon: '🌪️', x: 57, y: 26, description: 'Rajada de ar que catapulta os aventureiros (+1 movimento extra).', bonusMovement: 1, color: '#1A1AFF' },
  { id: 't22', index: 22, type: 'treasure', label: 'Relíquia da Sabedoria', icon: '🏆', x: 67, y: 24, description: 'Grande tesouro da floresta concedendo +100 XP!', bonusXp: 100, color: '#FFD600' },
  { id: 't23', index: 23, type: 'normal', label: 'Portões do Desfiladeiro', icon: '🚪', x: 77, y: 21, description: 'A entrada imponente para o covil do grande guardião.' },
  { id: 't24', index: 24, type: 'boss', label: 'GUARDIÃO DA FLORESTA', icon: '🐉', x: 87, y: 19, description: 'ÁREA DO CHEFÃO! A próxima questão vale 300 XP e exige destreza máxima!', color: '#E74C3C' },
  { id: 't25', index: 25, type: 'normal', label: 'Trilha dos Vencedores', icon: '✨', x: 77, y: 9, description: 'Piso de mármore dourado após superar o Guardião.' },
  { id: 't26', index: 26, type: 'turbo', label: 'Salto Épico', icon: '⚡', x: 63, y: 9, description: 'Arrancada espetacular rumo à fortaleza real.', bonusMovement: 1, color: '#1A1AFF' },
  { id: 't27', index: 27, type: 'treasure', label: 'Baú Real', icon: '👑', x: 49, y: 9, description: 'Recompensas de honra da Coroa (+100 XP).', bonusXp: 100, color: '#FFD600' },
  { id: 't28', index: 28, type: 'battle', label: 'Último Duelo', icon: '⚔️', x: 35, y: 9, description: 'O teste derradeiro de raciocínio entre os líderes.' },
  { id: 't29', index: 29, type: 'comeback', label: 'Última Esperança', icon: '🔥', x: 22, y: 9, description: 'Momento para uma virada histórica nos passos finais.', color: '#FF3B00' },
  { id: 't30', index: 30, type: 'castle', label: 'CASTELO DO SABER', icon: '🏰', x: 9, y: 9, description: 'O Trono Supremo do Conhecimento! Chegada triunfal da campanha.', color: '#FFD600' },
];

export const FOREST_OF_KNOWLEDGE_MAP: RPGMap = {
  id: 'forest-knowledge',
  name: 'Floresta do Saber',
  description: 'Uma trilha épica através de árvores milenares, riachos encantados, atalhos misteriosos e o lendário Guardião do Conhecimento.',
  theme: 'forest',
  tiles: FOREST_TILES,
  totalTiles: FOREST_TILES.length,
  bossIndices: [24],
  castleIndex: 30,
};

export const AVAILABLE_MAPS: RPGMap[] = [FOREST_OF_KNOWLEDGE_MAP];

// ─── Default Abilities ───────────────────────────────────────────────────

export function createInitialAbilities(): RPGAbility[] {
  return [
    {
      id: 'ab-shield',
      type: 'shield',
      name: 'Escudo Protetor',
      icon: '🛡️',
      description: 'Protege a posição da equipe contra efeitos adversos na rodada.',
      used: false,
    },
    {
      id: 'ab-turbo',
      type: 'turbo',
      name: 'Propulsor Turbo',
      icon: '⚡',
      description: 'Se acertar a próxima questão, ganha +1 casa extra de movimento!',
      used: false,
    },
    {
      id: 'ab-precision',
      type: 'precision',
      name: 'Foco Absoluto',
      icon: '🎯',
      description: 'Garante +50 XP de bônus em questões especiais ou difíceis.',
      used: false,
    },
    {
      id: 'ab-portal',
      type: 'portal',
      name: 'Salto Dimensional',
      icon: '🌀',
      description: 'Permite avançar 1 casa adicional imediatamente.',
      used: false,
    },
  ];
}

export function createInitialTeamState(teamId: string): RPGTeamState {
  return {
    teamId,
    currentTileIndex: 0,
    pathHistory: [0],
    xp: 0,
    totalMovement: 0,
    overtakesCount: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    streak: 0,
    maxStreak: 0,
    abilities: createInitialAbilities(),
    resources: { gems: 0, shields: 1, turbos: 0 },
    level: 1,
    title: 'Aprendiz do Saber',
  };
}

// ─── Calculate Movement ──────────────────────────────────────────────────

export function calculateMovement(
  earnedXp: number,
  isTurboActive = false,
  maxMovementCap = 5
): { movement: number; reason: string } {
  if (earnedXp <= 0) {
    return { movement: 0, reason: 'Errou a questão' };
  }

  let steps = 1;
  if (earnedXp >= 250) {
    steps = 4;
  } else if (earnedXp >= 180) {
    steps = 3;
  } else if (earnedXp >= 100) {
    steps = 2;
  } else {
    steps = 1;
  }

  if (isTurboActive) {
    steps += 1;
  }

  const finalSteps = Math.min(steps, maxMovementCap);
  return {
    movement: finalSteps,
    reason: isTurboActive
      ? `${finalSteps} casas (${earnedXp} XP + Turbo ativo ⚡)`
      : `${finalSteps} casas (${earnedXp} XP)`,
  };
}

// ─── Resolve Tile Landing ────────────────────────────────────────────────

export interface TileResolution {
  tile: RPGTile;
  message: string;
  bonusXp: number;
  bonusMovement: number;
  gainedAbility?: string;
  isBoss: boolean;
  isCastle: boolean;
}

export function resolveTileLanding(tile: RPGTile): TileResolution {
  let bonusXp = tile.bonusXp || 0;
  let bonusMovement = tile.bonusMovement || 0;
  let message = `Aterrissou em ${tile.label}.`;
  let isBoss = tile.type === 'boss';
  let isCastle = tile.type === 'castle';

  switch (tile.type) {
    case 'turbo':
      message = `⚡ CASA TURBO! Vento veloz concede impulso adicional de movimento!`;
      break;
    case 'treasure':
      message = `🎁 CASA TESOURO! Encontraram baú de relíquias (+${bonusXp} XP)!`;
      break;
    case 'shield':
      message = `🛡️ CASA ESCUDO! Barreira protetora adicionada ao inventário da equipe.`;
      break;
    case 'portal':
      message = `🌀 CASA PORTAL! Um vórtice mágico arremessou a equipe +${bonusMovement} casas!`;
      break;
    case 'boss':
      message = `🐉 ÁREA DO CHEFÃO! O Guardião da Floresta desafia a turma! Preparem-se!`;
      break;
    case 'comeback':
      message = `🔥 CASA DE VIRADA! Ponto de ignição: foco total para assumir a liderança (+${bonusXp} XP)!`;
      break;
    case 'castle':
      message = `🏰 CASTELO DO CONHECIMENTO! A equipe alcançou o grande objetivo final!`;
      break;
    default:
      message = `${tile.icon} ${tile.label}: Avanço seguro e constante.`;
      break;
  }

  return {
    tile,
    message,
    bonusXp,
    bonusMovement,
    isBoss,
    isCastle,
  };
}

// ─── Board Overtake Detection ────────────────────────────────────────────

export function detectBoardOvertakes(
  teams: Team[],
  teamStates: Record<string, RPGTeamState>
): OvertakeEvent[] {
  // Sort teams primarily by tile index descending, then by XP descending
  const currentSorted = [...teams].sort((a, b) => {
    const stateA = teamStates[a.id] || { currentTileIndex: 0, xp: a.score ?? 0 };
    const stateB = teamStates[b.id] || { currentTileIndex: 0, xp: b.score ?? 0 };

    if (stateB.currentTileIndex !== stateA.currentTileIndex) {
      return stateB.currentTileIndex - stateA.currentTileIndex;
    }
    return (stateB.xp ?? 0) - (stateA.xp ?? 0);
  });

  const events: OvertakeEvent[] = [];

  currentSorted.forEach((team, currentRankIdx) => {
    const currentRank = currentRankIdx + 1;
    const prevRank = team.previousPosition || team.position || currentRank;

    if (currentRank < prevRank) {
      const overtakenTeam = currentSorted.find((t, i) => i + 1 === prevRank);
      events.push({
        team,
        fromPosition: prevRank,
        toPosition: currentRank,
        overtakenTeam,
      });
    }
  });

  return events.sort((a, b) => (b.fromPosition - b.toPosition) - (a.fromPosition - a.toPosition));
}

// ─── Victory Check ───────────────────────────────────────────────────────

export function checkVictory(
  teams: Team[],
  teamStates: Record<string, RPGTeamState>,
  map: RPGMap,
  settings: Partial<GameSettings> = {},
  isLastQuestion = false
): { isOver: boolean; winner?: Team; reason?: string } {
  const victoryCondition = settings.rpgVictoryCondition || 'hybrid';
  const minXp = settings.minXpForVictory || 800;

  // 1. Check if any team reached or passed the castle tile
  const reachedCastleTeams = teams.filter((t) => {
    const state = teamStates[t.id];
    return state && state.currentTileIndex >= map.castleIndex;
  });

  if (victoryCondition === 'first_to_finish' && reachedCastleTeams.length > 0) {
    const winner = reachedCastleTeams.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
    return {
      isOver: true,
      winner,
      reason: `A equipe ${winner.name} foi a primeira a alcançar os portões do ${map.tiles[map.castleIndex].label}!`,
    };
  }

  if (victoryCondition === 'hybrid' && reachedCastleTeams.length > 0) {
    const qualifiedTeams = reachedCastleTeams.filter((t) => (t.score ?? 0) >= minXp);
    if (qualifiedTeams.length > 0) {
      const winner = qualifiedTeams.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
      return {
        isOver: true,
        winner,
        reason: `A equipe ${winner.name} conquistou o ${map.tiles[map.castleIndex].label} com maestria acadêmica (+${winner.score} XP)!`,
      };
    }
  }

  // 2. If all questions in the quiz have been answered
  if (isLastQuestion) {
    const sorted = [...teams].sort((a, b) => {
      const stateA = teamStates[a.id]?.currentTileIndex ?? 0;
      const stateB = teamStates[b.id]?.currentTileIndex ?? 0;
      if (stateB !== stateA) return stateB - stateA;
      return (b.score ?? 0) - (a.score ?? 0);
    });
    const winner = sorted[0];
    return {
      isOver: true,
      winner,
      reason: `Fim da campanha! A equipe ${winner?.name || 'Vencedora'} liderou o Reino com ${winner?.score ?? 0} XP!`,
    };
  }

  return { isOver: false };
}

// ─── Campaign Titles ─────────────────────────────────────────────────────

export function calculateCampaignTitle(totalXp: number): { level: number; title: string; nextLevelXp: number } {
  if (totalXp >= 10000) return { level: 20, title: 'Lenda Suprema do Reino', nextLevelXp: 15000 };
  if (totalXp >= 6000)  return { level: 15, title: 'Arquimago do Conhecimento', nextLevelXp: 10000 };
  if (totalXp >= 3500)  return { level: 10, title: 'Mestre do Saber', nextLevelXp: 6000 };
  if (totalXp >= 2000)  return { level: 7,  title: 'Cavaleiro Intelectual', nextLevelXp: 3500 };
  if (totalXp >= 1000)  return { level: 5,  title: 'Guerreiro do Saber', nextLevelXp: 2000 };
  if (totalXp >= 400)   return { level: 3,  title: 'Explorador Curioso', nextLevelXp: 1000 };
  return { level: 1, title: 'Aprendiz do Reino', nextLevelXp: 400 };
}
