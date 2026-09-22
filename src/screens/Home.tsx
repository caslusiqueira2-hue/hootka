import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuizStore } from '@/stores/quizStore';
import { useGameStore } from '@/stores/gameStore';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { Quiz, Game } from '@/types';
import NeoBrutalistButton from '@/components/ui/NeoBrutalistButton';
import NeoBrutalistCard from '@/components/ui/NeoBrutalistCard';
import NeoBrutalistBadge from '@/components/ui/NeoBrutalistBadge';
import { RPGDemoModal } from '@/components/rpg/RPGDemoModal';
import { RPGCampaignModal } from '@/components/rpg/RPGCampaignModal';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { quizzes, loading, loadQuizzes } = useQuizStore();
  const setSelectedQuiz = useGameStore((s) => s.setSelectedQuiz);
  const { user, signOut } = useAuthStore();
  const [activeGame, setActiveGame] = useState<Game | null>(null);

  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  useEffect(() => {
    loadQuizzes();
    api.game.getActive().then((g) => {
      if (g && g.state !== 'finished') setActiveGame(g);
    }).catch(() => {});
  }, [loadQuizzes]);

  const recentQuizzes = quizzes.slice(0, 4);

  const handlePlayQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    navigate('/game/setup');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-background)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Neo-Brutalist decorative shapes */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '240px',
          height: '240px',
          background: '#FFD600',
          border: '4px solid #0A0A0A',
          boxShadow: '8px 8px 0 #0A0A0A',
          transform: 'rotate(12deg)',
          opacity: 0.35,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '-30px',
          width: '180px',
          height: '180px',
          background: '#00C851',
          border: '4px solid #0A0A0A',
          boxShadow: '6px 6px 0 #0A0A0A',
          transform: 'rotate(-8deg)',
          opacity: 0.25,
          pointerEvents: 'none',
        }}
      />

      {/* Active game alert banner */}
      <AnimatePresence>
        {activeGame && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{
              background: '#FF3B00',
              color: '#FFFFFF',
              borderBottom: '4px solid #0A0A0A',
              padding: '0.75rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.5rem',
              zIndex: 100,
            }}
          >
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.05rem', letterSpacing: '0.04em' }}>
              ⚡ PARTIDA EM ANDAMENTO: "{activeGame.quiz_name}"
            </span>
            <NeoBrutalistButton
              variant="primary"
              size="sm"
              onClick={() => navigate(activeGame.mode === 'rpg' ? `/game/${activeGame.id}/rpg-board` : `/game/${activeGame.id}/question`)}
            >
              CONTINUAR PARTIDA ➔
            </NeoBrutalistButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          width: '100%',
          padding: '2rem 2rem 3rem',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 1,
        }}
      >
        {/* Teacher Account / Cloud Sync Status Bar */}
        <div
          style={{
            width: '100%',
            maxWidth: '900px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            padding: '0.75rem 1.25rem',
            background: '#FFFFFF',
            border: '3px solid #0A0A0A',
            boxShadow: '4px 4px 0 #0A0A0A',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem' }}>{user ? '👨‍🏫' : '🎒'}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '0.95rem' }}>
                {user ? user.email : 'Modo Convidado (Armazenamento Local)'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#555', fontWeight: 700 }}>
                {user
                  ? '☁️ Quizzes sincronizados na nuvem Supabase'
                  : '💾 Modo offline • Quizzes salvos localmente neste computador'}
              </div>
            </div>
          </div>

          <div>
            {user ? (
              <button
                onClick={() => signOut()}
                style={{
                  background: '#FFEBEB',
                  border: '2px solid #0A0A0A',
                  boxShadow: '2px 2px 0 #0A0A0A',
                  padding: '0.45rem 1rem',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                🚪 Sair da Conta
              </button>
            ) : (
              <button
                onClick={() => signOut()}
                style={{
                  background: '#FFD600',
                  border: '2px solid #0A0A0A',
                  boxShadow: '2px 2px 0 #0A0A0A',
                  padding: '0.45rem 1rem',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                🔑 Entrar / Criar Conta
              </button>
            )}
          </div>
        </div>

        {/* Hero Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ textAlign: 'center', marginBottom: '2.5rem' }}
        >
          <div
            style={{
              display: 'inline-block',
              background: '#FFD600',
              border: '4px solid #0A0A0A',
              boxShadow: '8px 8px 0 #0A0A0A',
              padding: '0.75rem 2.5rem',
              marginBottom: '1rem',
              transform: 'rotate(-1deg)',
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '3.8rem',
                fontWeight: 900,
                color: '#0A0A0A',
                margin: 0,
                letterSpacing: '0.05em',
                lineHeight: 1.1,
              }}
            >
              HOOTKA
            </h1>
          </div>

          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.4rem',
              color: '#0A0A0A',
              margin: '0.5rem 0 0',
              letterSpacing: '0.02em',
            }}
          >
            "Seu quiz. Sua turma. Sua competição offline."
          </p>

          <p style={{ color: '#666', fontSize: '0.95rem', fontWeight: 600, marginTop: '0.25rem' }}>
            Game show para sala de aula com cards físicos A/B/C/D • 100% sem internet • Sem celular dos alunos
          </p>
        </motion.div>

        {/* RPG Featured Feature Card */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            width: '100%',
            maxWidth: '900px',
            marginBottom: '2.5rem',
          }}
        >
          <NeoBrutalistCard
            style={{
              padding: '1.5rem 2rem',
              background: '#00C851',
              color: '#FFFFFF',
              border: '4px solid #0A0A0A',
              boxShadow: '8px 8px 0 #0A0A0A',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '2.5rem' }}>🗺️</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h2
                      style={{
                        margin: 0,
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 900,
                        fontSize: '1.6rem',
                        letterSpacing: '0.03em',
                        textTransform: 'uppercase',
                        color: '#0A0A0A',
                      }}
                    >
                      HOOTKA RPG: O REINO DO CONHECIMENTO
                    </h2>
                    <NeoBrutalistBadge variant="primary">
                      NOVO MODO DE JOGO!
                    </NeoBrutalistBadge>
                  </div>
                  <p style={{ margin: '0.25rem 0 0', fontWeight: 800, fontSize: '0.95rem', color: '#0A0A0A' }}>
                    PERGUNTAS ➔ ACERTOS ➔ XP ➔ MOVIMENTO NO MAPA ➔ EVENTOS ➔ CHEFÃO ➔ CASTELO!
                  </p>
                </div>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#0A0A0A', lineHeight: 1.4 }}>
              Transforme qualquer quiz existente numa jornada de tabuleiro medieval projetada para sala de aula! Sem dados aleatórios: avanço 100% fundamentado em mérito pedagógico.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <NeoBrutalistButton
                variant="primary"
                size="md"
                onClick={() => setShowDemoModal(true)}
                style={{ background: '#FFD600', color: '#0A0A0A' }}
              >
                🎮 TESTAR DEMO INTERATIVA (1-CLIQUE)
              </NeoBrutalistButton>

              <NeoBrutalistButton
                variant="ghost"
                size="md"
                onClick={() => setShowCampaignModal(true)}
                style={{ background: '#FFFFFF', color: '#0A0A0A' }}
              >
                📜 CRÔNICAS E PROGRESSÃO DA TURMA
              </NeoBrutalistButton>

              <NeoBrutalistButton
                variant="ghost"
                size="md"
                onClick={() => navigate('/game/new')}
                style={{ background: '#1A1AFF', color: '#FFFFFF' }}
              >
                ⚔️ JOGAR MODO RPG AGORA
              </NeoBrutalistButton>
            </div>
          </NeoBrutalistCard>
        </motion.div>

        {/* Action Buttons Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
            width: '100%',
            maxWidth: '900px',
            marginBottom: '3.5rem',
          }}
        >
          <NeoBrutalistButton
            variant="primary"
            size="xl"
            fullWidth
            onClick={() => navigate('/game/new')}
            style={{ fontSize: '1.35rem', gridColumn: 'span 2' }}
          >
            🚀 NOVO JOGO
          </NeoBrutalistButton>

          <NeoBrutalistButton
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => navigate('/quiz/new')}
          >
            + CRIAR QUIZ
          </NeoBrutalistButton>

          <NeoBrutalistButton
            variant="ghost"
            size="lg"
            fullWidth
            onClick={() => navigate('/quizzes')}
          >
            📚 MEUS QUIZZES
          </NeoBrutalistButton>

          <NeoBrutalistButton
            variant="ghost"
            size="lg"
            fullWidth
            onClick={() => navigate('/history')}
          >
            📊 HISTÓRICO
          </NeoBrutalistButton>

          <NeoBrutalistButton
            variant="ghost"
            size="lg"
            fullWidth
            onClick={() => navigate('/settings')}
          >
            ⚙️ CONFIGURAÇÕES
          </NeoBrutalistButton>
        </div>

        {/* Available Quizzes Carousel / List */}
        <div style={{ width: '100%', maxWidth: '900px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              borderBottom: '3px solid #0A0A0A',
              paddingBottom: '0.5rem',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 900,
                fontSize: '1.4rem',
                margin: 0,
                letterSpacing: '0.04em',
              }}
            >
              QUIZZES DISPONÍVEIS
            </h2>

            <button
              onClick={() => navigate('/quizzes')}
              style={{
                background: 'transparent',
                border: 'none',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '0.95rem',
                color: '#FF3B00',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Ver todos ({quizzes.length}) ➔
            </button>
          </div>

          {loading ? (
            <p style={{ fontWeight: 700 }}>Carregando biblioteca de quizzes...</p>
          ) : recentQuizzes.length === 0 ? (
            <NeoBrutalistCard style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ fontWeight: 700, margin: '0 0 1rem' }}>Você ainda não criou nenhum quiz.</p>
              <NeoBrutalistButton variant="primary" size="md" onClick={() => navigate('/quiz/new')}>
                CRIAR PRIMEIRO QUIZ
              </NeoBrutalistButton>
            </NeoBrutalistCard>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1rem',
              }}
            >
              {recentQuizzes.map((quiz) => (
                <NeoBrutalistCard
                  key={quiz.id}
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, background: '#E0E0E0', border: '1px solid #0A0A0A', padding: '0.1rem 0.4rem' }}>
                        {quiz.question_count ?? 10} QUESTÕES
                      </span>
                      {quiz.subject && (
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1A1AFF' }}>
                          {quiz.subject}
                        </span>
                      )}
                    </div>
                    <h3
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 900,
                        fontSize: '1.15rem',
                        margin: '0 0 0.5rem',
                        lineHeight: 1.25,
                      }}
                    >
                      {quiz.name}
                    </h3>
                  </div>

                  <NeoBrutalistButton
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => handlePlayQuiz(quiz)}
                    style={{ marginTop: '0.75rem' }}
                  >
                    JOGAR AGORA ➔
                  </NeoBrutalistButton>
                </NeoBrutalistCard>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive RPG Demo Simulator Modal */}
      <RPGDemoModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
      />

      {/* Persistent Campaign Chronicles Modal */}
      <RPGCampaignModal
        isOpen={showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
      />
    </div>
  );
};

export default Home;
