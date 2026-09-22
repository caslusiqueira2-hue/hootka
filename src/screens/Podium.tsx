import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { api } from '@/lib/api';
import soundEngine from '@/utils/soundEngine';
import Confetti from '@/components/game/Confetti';
import NeoBrutalistButton from '@/components/ui/NeoBrutalistButton';
import NeoBrutalistCard from '@/components/ui/NeoBrutalistCard';
import NeoBrutalistModal from '@/components/ui/NeoBrutalistModal';
import NeoBrutalistBadge from '@/components/ui/NeoBrutalistBadge';

export const Podium: React.FC = () => {
  const { id: gameId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const active = useGameStore((s) => s.active);
  const { game, teams, questions } = active;

  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [statsData, setStatsData] = useState<any>(null);

  // Sort teams desc by score
  const sortedTeams = [...teams].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const winner = sortedTeams[0];
  const second = sortedTeams[1];
  const third = sortedTeams[2];
  const remaining = sortedTeams.slice(3);

  useEffect(() => {
    soundEngine.playVictory();

    // Mark game as finished in database
    if (gameId) {
      api.game.finish(gameId);
      api.game.getStats(gameId).then((res) => setStatsData(res)).catch(() => {});
    }
  }, [gameId]);

  const handleFinishAndExit = () => {
    navigate('/');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A0A0A',
        color: '#FFFFFF',
        padding: '2rem',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Confetti active={true} duration={8000} />

      {/* Title Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
        style={{ textAlign: 'center', marginBottom: '2rem', zIndex: 10 }}
      >
        <div
          style={{
            display: 'inline-block',
            background: '#FFD600',
            color: '#0A0A0A',
            border: '4px solid #FFFFFF',
            boxShadow: '6px 6px 0 #FF3B00',
            padding: '0.5rem 2rem',
            fontFamily: 'var(--font-heading)',
            fontWeight: 900,
            fontSize: '2.5rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          🏆 CAMPEÕES DO QUIZ! 🏆
        </div>
        <p style={{ color: '#BBB', fontWeight: 700, marginTop: '0.75rem', fontSize: '1.1rem' }}>
          {game?.quiz_name || 'Partida Finalizada'} • Classificação Definitiva
        </p>
      </motion.div>

      {/* Podium Visual (Top 3) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '1.5rem',
          maxWidth: '850px',
          width: '100%',
          marginBottom: '2.5rem',
          zIndex: 10,
        }}
      >
        {/* 2nd Place */}
        {second && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6, type: 'spring' }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>{second.emoji}</div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 900,
                fontSize: '1.25rem',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: '0.25rem',
              }}
            >
              {second.name}
            </div>
            <div style={{ color: '#FFD600', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.75rem' }}>
              {second.score ?? 0} pts
            </div>

            {/* Podium Block 2 */}
            <div
              style={{
                width: '100%',
                height: '170px',
                background: '#E0E0E0',
                border: '4px solid #FFFFFF',
                boxShadow: '6px 6px 0 #FF3B00',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0A0A0A',
              }}
            >
              <span style={{ fontSize: '2.5rem' }}>🥈</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.75rem' }}>2º LUGAR</span>
            </div>
          </motion.div>
        )}

        {/* 1st Place (Winner) */}
        {winner && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.7, type: 'spring', bounce: 0.4 }}
            style={{
              flex: 1.2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <motion.div
              animate={{ rotate: [-3, 3, -3], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ fontSize: '5.5rem', marginBottom: '0.5rem' }}
            >
              {winner.emoji}
            </motion.div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 900,
                fontSize: '1.8rem',
                color: '#FFD600',
                textAlign: 'center',
                marginBottom: '0.25rem',
                letterSpacing: '0.04em',
              }}
            >
              {winner.name}
            </div>
            <div
              style={{
                background: '#FF3B00',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '1.35rem',
                padding: '0.2rem 1rem',
                border: '2px solid #FFFFFF',
                marginBottom: '0.75rem',
              }}
            >
              {winner.score ?? 0} PONTOS
            </div>

            {/* Podium Block 1 */}
            <div
              style={{
                width: '100%',
                height: '220px',
                background: '#FFD600',
                border: '5px solid #FFFFFF',
                boxShadow: '8px 8px 0 #FF3B00',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0A0A0A',
              }}
            >
              <span style={{ fontSize: '3.5rem' }}>👑</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '2.2rem' }}>1º LUGAR</span>
              <span style={{ fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.1em' }}>CAMPEÃO</span>
            </div>
          </motion.div>
        )}

        {/* 3rd Place */}
        {third && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>{third.emoji}</div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 900,
                fontSize: '1.25rem',
                color: '#FFFFFF',
                textAlign: 'center',
                marginBottom: '0.25rem',
              }}
            >
              {third.name}
            </div>
            <div style={{ color: '#FFD600', fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.75rem' }}>
              {third.score ?? 0} pts
            </div>

            {/* Podium Block 3 */}
            <div
              style={{
                width: '100%',
                height: '130px',
                background: '#CD7F32',
                border: '4px solid #FFFFFF',
                boxShadow: '6px 6px 0 #FF3B00',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <span style={{ fontSize: '2.5rem' }}>🥉</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.75rem' }}>3º LUGAR</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Remaining Teams (4th, 5th, etc.) */}
      {remaining.length > 0 && (
        <div style={{ maxWidth: '650px', width: '100%', marginBottom: '2.5rem', zIndex: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {remaining.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#1A1A1A',
                  border: '2px solid #444',
                  padding: '0.75rem 1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#888', fontSize: '1.1rem' }}>
                    {i + 4}º
                  </span>
                  <span style={{ fontSize: '1.5rem' }}>{t.emoji}</span>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem' }}>{t.name}</span>
                </div>
                <span style={{ fontWeight: 800, color: '#FFD600', fontSize: '1.1rem' }}>{t.score ?? 0} pts</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Buttons Footer */}
      <div style={{ display: 'flex', gap: '1.25rem', zIndex: 10 }}>
        <NeoBrutalistButton variant="ghost" size="lg" onClick={() => setStatsModalOpen(true)}>
          📊 VER ESTATÍSTICAS DA PARTIDA
        </NeoBrutalistButton>

        <NeoBrutalistButton variant="primary" size="lg" onClick={handleFinishAndExit}>
          SALVAR E VOLTAR AO INÍCIO 🏁
        </NeoBrutalistButton>
      </div>

      {/* Stats Modal */}
      <NeoBrutalistModal
        isOpen={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        title="ESTATÍSTICAS DA PARTIDA"
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#F5F0E8', border: '3px solid #0A0A0A', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#555' }}>TOTAL DE QUESTÕES</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>{questions.length}</div>
            </div>

            <div style={{ background: '#F5F0E8', border: '3px solid #0A0A0A', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#555' }}>TOTAL DE EQUIPES</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>{teams.length}</div>
            </div>

            <div style={{ background: '#F5F0E8', border: '3px solid #0A0A0A', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#555' }}>EQUIPE CAMPEÃ</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>
                {winner ? `${winner.emoji} ${winner.name}` : '-'}
              </div>
            </div>

            <div style={{ background: '#F5F0E8', border: '3px solid #0A0A0A', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#555' }}>MAIOR PONTUAÇÃO</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#FF3B00' }}>
                {winner?.score ?? 0} pts
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, margin: '0 0 0.5rem' }}>Classificação Completa</h4>
            <div style={{ border: '2px solid #0A0A0A' }}>
              {sortedTeams.map((t, idx) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.6rem 1rem',
                    borderBottom: idx < sortedTeams.length - 1 ? '1px solid #CCC' : 'none',
                    background: idx === 0 ? '#FFF9C4' : '#FFFFFF',
                    fontWeight: 700,
                  }}
                >
                  <span>{idx + 1}º {t.emoji} {t.name}</span>
                  <span>{t.score ?? 0} pts</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <NeoBrutalistButton variant="primary" size="md" onClick={() => setStatsModalOpen(false)}>
              FECHAR
            </NeoBrutalistButton>
          </div>
        </div>
      </NeoBrutalistModal>
    </div>
  );
};

export default Podium;
