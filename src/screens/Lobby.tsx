import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore, TeamDraft } from '@/stores/gameStore';
import { api } from '@/lib/api';
import NeoBrutalistButton from '@/components/ui/NeoBrutalistButton';
import NeoBrutalistCard from '@/components/ui/NeoBrutalistCard';
import NeoBrutalistModal from '@/components/ui/NeoBrutalistModal';

const DEFAULT_EMOJIS = ['🦊', '🐺', '🦁', '🐯', '🦅', '🦈', '🐻', '🐼', '🦄', '🐲', '⚡', '🔥', '🚀', '🎯', '🌟', '🏆'];
const DEFAULT_COLORS = ['#FF3B00', '#1A1AFF', '#00C851', '#FFD600', '#FF6D00', '#9B59B6', '#E74C3C', '#16A085', '#2C3E50'];

const INITIAL_TEAMS: TeamDraft[] = [
  { id: 'team-1', name: 'RAPOSAS', emoji: '🦊', color: '#FF3B00', identifier: 'Equipe 1' },
  { id: 'team-2', name: 'LOBOS', emoji: '🐺', color: '#1A1AFF', identifier: 'Equipe 2' },
  { id: 'team-3', name: 'LEÕES', emoji: '🦁', color: '#FFD600', identifier: 'Equipe 3' },
  { id: 'team-4', name: 'TIGRES', emoji: '🐯', color: '#FF6D00', identifier: 'Equipe 4' },
  { id: 'team-5', name: 'ÁGUIAS', emoji: '🦅', color: '#00C851', identifier: 'Equipe 5' },
];

export const Lobby: React.FC = () => {
  const navigate = useNavigate();
  const pendingSetup = useGameStore((s) => s.pendingSetup);
  const setActiveGame = useGameStore((s) => s.setActiveGame);

  const [teams, setTeams] = useState<TeamDraft[]>(
    pendingSetup.teams.length > 0 ? pendingSetup.teams : INITIAL_TEAMS
  );

  // Modal for add/edit team
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamEmoji, setTeamEmoji] = useState('🦊');
  const [teamColor, setTeamColor] = useState('#FF3B00');
  const [teamIdentifier, setTeamIdentifier] = useState('');
  const [starting, setStarting] = useState(false);

  const openAddTeam = () => {
    setEditingIndex(null);
    setTeamName('');
    const randomEmoji = DEFAULT_EMOJIS[teams.length % DEFAULT_EMOJIS.length];
    const randomColor = DEFAULT_COLORS[teams.length % DEFAULT_COLORS.length];
    setTeamEmoji(randomEmoji);
    setTeamColor(randomColor);
    setTeamIdentifier(`Equipe ${teams.length + 1}`);
    setModalOpen(true);
  };

  const openEditTeam = (idx: number) => {
    const t = teams[idx];
    setEditingIndex(idx);
    setTeamName(t.name);
    setTeamEmoji(t.emoji);
    setTeamColor(t.color);
    setTeamIdentifier(t.identifier || '');
    setModalOpen(true);
  };

  const handleSaveTeam = () => {
    if (!teamName.trim()) {
      alert('Digite o nome da equipe!');
      return;
    }

    if (editingIndex !== null) {
      const updated = [...teams];
      updated[editingIndex] = {
        ...updated[editingIndex],
        name: teamName.trim().toUpperCase(),
        emoji: teamEmoji,
        color: teamColor,
        identifier: teamIdentifier.trim(),
      };
      setTeams(updated);
    } else {
      const newTeam: TeamDraft = {
        id: 'team-' + Date.now(),
        name: teamName.trim().toUpperCase(),
        emoji: teamEmoji,
        color: teamColor,
        identifier: teamIdentifier.trim() || `Equipe ${teams.length + 1}`,
      };
      setTeams([...teams, newTeam]);
    }

    setModalOpen(false);
  };

  const handleDeleteTeam = (idx: number) => {
    if (teams.length <= 2) {
      alert('O jogo precisa de pelo menos 2 equipes!');
      return;
    }
    setTeams(teams.filter((_, i) => i !== idx));
  };

  const handleStartGame = async () => {
    if (teams.length < 2) {
      alert('Adicione pelo menos 2 equipes para iniciar o jogo!');
      return;
    }

    if (!pendingSetup.quiz) {
      alert('Nenhum quiz selecionado! Volte para a tela inicial e escolha um quiz.');
      navigate('/game/new');
      return;
    }

    setStarting(true);
    try {
      // 1. Create game in SQLite / DB
      const { id: gameId } = await api.game.create({
        quiz_id: pendingSetup.quiz.id,
        quiz_name: pendingSetup.quiz.name,
        mode: pendingSetup.mode,
        settings: pendingSetup.settings,
        teams: teams.map((t, idx) => ({
          ...t,
          order_index: idx,
          score: 0,
          streak: 0,
        })),
      });

      // 2. Fetch the created game with snapshot questions
      const game = await api.game.getById(gameId);

      // 3. Update game state to question
      await api.game.updateState(gameId, 'question', {
        started_at: new Date().toISOString(),
        current_question_index: 0,
      });

      // 4. Update Zustand store
      setActiveGame(
        game,
        game.teams || teams.map((t) => ({ ...t, game_id: gameId, score: 0, streak: 0, order_index: 0 })),
        game.questions || []
      );

      // 5. Navigate to the question screen
      navigate(`/game/${gameId}/question`);
    } catch (err: any) {
      alert('Erro ao iniciar jogo: ' + err.message);
      setStarting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NeoBrutalistButton variant="ghost" size="sm" onClick={() => navigate('/game/setup')}>
              ← CONFIGURAÇÃO
            </NeoBrutalistButton>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>
              LOBBY
            </h1>
          </div>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#555', margin: '0.25rem 0 0 4rem' }}>
            Quiz: <strong>{pendingSetup.quiz?.name || 'Quiz Selecionado'}</strong> • Monte as equipes da sala (2 a 20 equipes)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <NeoBrutalistButton
            variant="ghost"
            size="md"
            onClick={openAddTeam}
            disabled={teams.length >= 20}
          >
            + ADICIONAR EQUIPE
          </NeoBrutalistButton>

          <NeoBrutalistButton
            variant="primary"
            size="lg"
            onClick={handleStartGame}
            disabled={teams.length < 2 || starting}
          >
            {starting ? 'INICIANDO...' : 'INICIAR JOGO 🚀'}
          </NeoBrutalistButton>
        </div>
      </div>

      {/* Teams Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {teams.map((t, idx) => (
          <motion.div key={t.id} layout initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <NeoBrutalistCard
              style={{
                padding: '1.5rem',
                borderTop: `8px solid ${t.color}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <div style={{ position: 'absolute', top: '8px', left: '10px', fontSize: '0.8rem', fontWeight: 800, color: '#777' }}>
                #{idx + 1}
              </div>

              <div style={{ fontSize: '3.5rem', margin: '0.5rem 0', userSelect: 'none' }}>
                {t.emoji}
              </div>

              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.4rem', margin: '0 0 0.25rem', letterSpacing: '0.04em' }}>
                {t.name}
              </h3>

              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#666', marginBottom: '1rem' }}>
                {t.identifier || `Equipe ${idx + 1}`}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <NeoBrutalistButton variant="ghost" size="sm" fullWidth onClick={() => openEditTeam(idx)}>
                  EDITAR
                </NeoBrutalistButton>
                <NeoBrutalistButton variant="danger" size="sm" onClick={() => handleDeleteTeam(idx)}>
                  ✕
                </NeoBrutalistButton>
              </div>
            </NeoBrutalistCard>
          </motion.div>
        ))}
      </div>

      {/* Add / Edit Team Modal */}
      <NeoBrutalistModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingIndex !== null ? 'EDITAR EQUIPE' : 'NOVA EQUIPE'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem' }}>
              NOME DA EQUIPE *
            </label>
            <input
              type="text"
              className="neo-input"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Ex: RAPOSAS, LEÕES, ÁGUIAS..."
              style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem' }}>
              ESCOLHA O EMOJI
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {DEFAULT_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setTeamEmoji(emoji)}
                  style={{
                    fontSize: '1.75rem',
                    padding: '0.4rem',
                    border: teamEmoji === emoji ? '3px solid #0A0A0A' : '2px solid transparent',
                    background: teamEmoji === emoji ? 'var(--color-accent)' : '#FFF',
                    cursor: 'pointer',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem' }}>
              COR DA EQUIPE
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setTeamColor(color)}
                  style={{
                    width: '36px',
                    height: '36px',
                    background: color,
                    border: teamColor === color ? '4px solid #0A0A0A' : '2px solid #0A0A0A',
                    boxShadow: teamColor === color ? '2px 2px 0 #0A0A0A' : 'none',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem' }}>
              IDENTIFICADOR (OPCIONAL)
            </label>
            <input
              type="text"
              className="neo-input"
              value={teamIdentifier}
              onChange={(e) => setTeamIdentifier(e.target.value)}
              placeholder="Ex: Mesa 1, Fila A"
              style={{ width: '100%', padding: '0.6rem', fontWeight: 600 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <NeoBrutalistButton variant="ghost" size="md" onClick={() => setModalOpen(false)}>
              CANCELAR
            </NeoBrutalistButton>
            <NeoBrutalistButton variant="primary" size="md" onClick={handleSaveTeam}>
              SALVAR EQUIPE
            </NeoBrutalistButton>
          </div>
        </div>
      </NeoBrutalistModal>
    </div>
  );
};

export default Lobby;
