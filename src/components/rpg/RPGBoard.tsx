import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Team, RPGMap, RPGTile, RPGTeamState } from '@/types';
import NeoBrutalistCard from '@/components/ui/NeoBrutalistCard';

interface RPGBoardProps {
  map: RPGMap;
  teams: Team[];
  teamStates: Record<string, RPGTeamState>;
  onTileClick?: (tile: RPGTile) => void;
  activeMovingTeamId?: string | null;
  highlightedTileIndex?: number | null;
}

export const RPGBoard: React.FC<RPGBoardProps> = ({
  map,
  teams,
  teamStates,
  onTileClick,
  activeMovingTeamId,
  highlightedTileIndex,
}) => {
  const [selectedTile, setSelectedTile] = useState<RPGTile | null>(null);

  // Group teams by their current tile index
  const teamsOnTiles: Record<number, Team[]> = {};
  teams.forEach((team) => {
    const tileIdx = teamStates[team.id]?.currentTileIndex ?? 0;
    if (!teamsOnTiles[tileIdx]) teamsOnTiles[tileIdx] = [];
    teamsOnTiles[tileIdx].push(team);
  });

  const handleTileSelect = (tile: RPGTile) => {
    setSelectedTile(tile);
    if (onTileClick) onTileClick(tile);
  };

  // Generate SVG path connecting the tiles sequentially
  const svgPathD = map.tiles.reduce((acc, tile, idx) => {
    if (idx === 0) return `M ${tile.x * 10} ${tile.y * 6}`;
    return `${acc} L ${tile.x * 10} ${tile.y * 6}`;
  }, '');

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        background: '#FAF6EE',
        border: '4px solid #0A0A0A',
        boxShadow: '8px 8px 0 #0A0A0A',
        borderRadius: '4px',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Map Header */}
      <div
        style={{
          background: '#0A0A0A',
          color: '#FFFFFF',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '4px solid #0A0A0A',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.6rem' }}>🌲</span>
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.25rem',
                fontWeight: 900,
                margin: 0,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {map.name}
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#FFD600', fontWeight: 700 }}>
              {map.totalTiles} CASAS • TABULEIRO DO CONHECIMENTO
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {teams.map((t) => {
            const state = teamStates[t.id];
            return (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: t.color,
                  border: '2px solid #FFFFFF',
                  boxShadow: '2px 2px 0 #0A0A0A',
                  padding: '0.2rem 0.6rem',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                  color: '#0A0A0A',
                }}
              >
                <span>{t.emoji}</span>
                <span>CASA {state?.currentTileIndex ?? 0}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Board Canvas (16:9 Aspect Ratio) */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '58%', // 16:9 aspect ratio container
          background: 'radial-gradient(circle at 50% 50%, #FAF6EE 0%, #EFE7D8 100%)',
          overflow: 'hidden',
        }}
      >
        {/* SVG Path Layer */}
        <svg
          viewBox="0 0 1000 600"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          {/* Path Shadow */}
          <path
            d={svgPathD}
            fill="none"
            stroke="#0A0A0A"
            strokeWidth="18"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
          {/* Path Body */}
          <path
            d={svgPathD}
            fill="none"
            stroke="#FFD600"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Path Dash Accent */}
          <path
            d={svgPathD}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeDasharray="10, 10"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.75"
          />
        </svg>

        {/* Board Tiles */}
        {map.tiles.map((tile) => {
          const isSelected = selectedTile?.id === tile.id;
          const isHighlighted = highlightedTileIndex === tile.index;
          const teamsHere = teamsOnTiles[tile.index] || [];
          const isSpecial = tile.type !== 'normal';

          // Tile colors based on type
          let tileBg = '#FFFFFF';
          let borderColor = '#0A0A0A';
          if (tile.type === 'start') tileBg = '#FFD600';
          else if (tile.type === 'turbo') tileBg = '#80D8FF';
          else if (tile.type === 'treasure') tileBg = '#FFE57F';
          else if (tile.type === 'shield') tileBg = '#B9F6CA';
          else if (tile.type === 'portal') tileBg = '#EA80FC';
          else if (tile.type === 'boss') {
            tileBg = '#FF8A80';
            borderColor = '#C62828';
          } else if (tile.type === 'comeback') tileBg = '#FFAB91';
          else if (tile.type === 'castle') tileBg = '#FFD700';

          return (
            <motion.div
              key={tile.id}
              onClick={() => handleTileSelect(tile)}
              whileHover={{ scale: 1.15, zIndex: 40 }}
              whileTap={{ scale: 0.95 }}
              animate={isHighlighted ? { scale: [1, 1.25, 1] } : {}}
              transition={isHighlighted ? { repeat: Infinity, duration: 1.2 } : {}}
              style={{
                position: 'absolute',
                left: `${tile.x}%`,
                top: `${tile.y}%`,
                transform: 'translate(-50%, -50%)',
                width: tile.type === 'castle' || tile.type === 'boss' ? '54px' : '40px',
                height: tile.type === 'castle' || tile.type === 'boss' ? '54px' : '40px',
                background: tileBg,
                border: `3px solid ${borderColor}`,
                boxShadow: isSelected
                  ? '0 0 0 3px #1A1AFF, 4px 4px 0 #0A0A0A'
                  : '3px 3px 0 #0A0A0A',
                borderRadius: tile.type === 'castle' ? '8px' : '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: isSelected ? 50 : 20,
              }}
            >
              <span style={{ fontSize: tile.type === 'castle' || tile.type === 'boss' ? '1.4rem' : '1rem' }}>
                {tile.icon}
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  fontFamily: 'var(--font-heading)',
                  color: '#0A0A0A',
                  lineHeight: 1,
                  marginTop: '-2px',
                }}
              >
                {tile.index}
              </span>

              {/* Stack of Teams on this tile */}
              {teamsHere.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-18px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '2px',
                    zIndex: 60,
                  }}
                >
                  {teamsHere.map((team, idx) => {
                    const isMoving = activeMovingTeamId === team.id;
                    return (
                      <motion.div
                        key={team.id}
                        initial={{ scale: 0, y: -10 }}
                        animate={{
                          scale: isMoving ? [1, 1.3, 1] : 1,
                          y: isMoving ? [0, -8, 0] : 0,
                        }}
                        transition={isMoving ? { repeat: Infinity, duration: 0.6 } : {}}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: team.color,
                          border: '2px solid #0A0A0A',
                          boxShadow: '2px 2px 0 #0A0A0A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          marginLeft: idx > 0 ? '-6px' : 0,
                        }}
                        title={`${team.name} (${teamStates[team.id]?.xp ?? 0} XP)`}
                      >
                        {team.emoji}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Tile Detail Bar / Drawer */}
      <AnimatePresence>
        {selectedTile && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              background: '#FFFFFF',
              borderTop: '3px solid #0A0A0A',
              padding: '0.75rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>{selectedTile.icon}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 900,
                      fontSize: '1rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    Casa {selectedTile.index}: {selectedTile.label}
                  </span>
                  {selectedTile.type !== 'normal' && (
                    <span
                      style={{
                        background: '#0A0A0A',
                        color: '#FFD600',
                        fontSize: '0.7rem',
                        fontWeight: 900,
                        padding: '0.1rem 0.4rem',
                        borderRadius: '2px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {selectedTile.type}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#444', fontWeight: 600 }}>
                  {selectedTile.description}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedTile(null)}
              style={{
                background: 'transparent',
                border: '2px solid #0A0A0A',
                fontWeight: 900,
                fontSize: '0.85rem',
                padding: '0.2rem 0.6rem',
                cursor: 'pointer',
              }}
            >
              FECHAR ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board Legend */}
      <div
        style={{
          background: '#FFFFFF',
          borderTop: '3px solid #0A0A0A',
          padding: '0.5rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.25rem',
          fontSize: '0.75rem',
          fontWeight: 800,
          fontFamily: 'var(--font-heading)',
          color: '#333',
        }}
      >
        <span>⚡ TURBO (+1 PASSO)</span>
        <span>🎁 TESOURO (+XP)</span>
        <span>🛡️ ESCUDO</span>
        <span>🌀 PORTAL (+2 CASAS)</span>
        <span>⚔️ ARENA (DISPUTA)</span>
        <span>🔥 VIRADA (RECUPERAÇÃO)</span>
        <span>🐉 CASA 24: CHEFÃO (300 XP)</span>
        <span>🏰 CASA 30: CASTELO FINAL</span>
      </div>
    </div>
  );
};

export default RPGBoard;
