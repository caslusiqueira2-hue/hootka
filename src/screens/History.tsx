import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import NeoBrutalistButton from '@/components/ui/NeoBrutalistButton';
import NeoBrutalistCard from '@/components/ui/NeoBrutalistCard';
import NeoBrutalistBadge from '@/components/ui/NeoBrutalistBadge';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);
  const [gameDetails, setGameDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await api.game.getAll();
      setGames(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (gameId: string) => {
    if (expandedGameId === gameId) {
      setExpandedGameId(null);
      return;
    }

    setExpandedGameId(gameId);
    if (!gameDetails[gameId]) {
      try {
        const details = await api.game.getById(gameId);
        setGameDetails((prev) => ({ ...prev, [gameId]: details }));
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <NeoBrutalistButton variant="ghost" size="sm" onClick={() => navigate('/')}>
            ← VOLTAR
          </NeoBrutalistButton>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>
            HISTÓRICO DE PARTIDAS
          </h1>
        </div>
      </div>

      {loading ? (
        <p style={{ fontWeight: 800, fontSize: '1.2rem' }}>Carregando histórico...</p>
      ) : games.length === 0 ? (
        <NeoBrutalistCard style={{ padding: '3rem', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem' }}>📜</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, marginTop: '1rem' }}>
            Nenhuma partida registrada ainda
          </h2>
          <p style={{ color: '#555', marginBottom: '1.5rem' }}>
            Quando você concluir partidas com suas turmas, o histórico completo aparecerá aqui.
          </p>
          <NeoBrutalistButton variant="primary" size="md" onClick={() => navigate('/game/new')}>
            INICIAR NOVA PARTIDA
          </NeoBrutalistButton>
        </NeoBrutalistCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {games.map((g) => {
            const isExpanded = expandedGameId === g.id;
            const details = gameDetails[g.id];
            const dateStr = g.created_at ? new Date(g.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Data recente';

            return (
              <NeoBrutalistCard key={g.id} style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <NeoBrutalistBadge variant="primary">{g.mode?.toUpperCase() || 'CLÁSSICO'}</NeoBrutalistBadge>
                      <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 700 }}>📅 {dateStr}</span>
                    </div>

                    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.4rem', margin: 0 }}>
                      {g.quiz_name || 'Quiz'}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem' }}>
                      👥 {g.team_count || g.teams?.length || 0} equipes
                    </span>

                    <NeoBrutalistButton variant="ghost" size="sm" onClick={() => toggleExpand(g.id)}>
                      {isExpanded ? '▲ MENOS DETALHES' : '▼ VER CLASSIFICAÇÃO'}
                    </NeoBrutalistButton>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ marginTop: '1.25rem', borderTop: '2px solid #0A0A0A', paddingTop: '1rem' }}>
                    {details && details.teams ? (
                      <div>
                        <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, margin: '0 0 0.75rem' }}>
                          Equipes da Partida:
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {details.teams.map((t: any, idx: number) => (
                            <div
                              key={t.id}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '0.5rem 1rem',
                                background: idx === 0 ? '#FFF9C4' : '#F5F0E8',
                                border: '2px solid #0A0A0A',
                                fontWeight: 700,
                              }}
                            >
                              <span>{idx + 1}º {t.emoji} {t.name}</span>
                              <span style={{ color: '#FF3B00', fontWeight: 900 }}>{t.score ?? 0} pts</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: '#666', margin: 0 }}>Carregando equipes...</p>
                    )}
                  </div>
                )}
              </NeoBrutalistCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
