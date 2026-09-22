import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuizStore } from '@/stores/quizStore';
import { useGameStore } from '@/stores/gameStore';
import { api } from '@/lib/api';
import type { Quiz } from '@/types';
import NeoBrutalistButton from '@/components/ui/NeoBrutalistButton';
import NeoBrutalistCard from '@/components/ui/NeoBrutalistCard';
import NeoBrutalistModal from '@/components/ui/NeoBrutalistModal';
import NeoBrutalistBadge from '@/components/ui/NeoBrutalistBadge';

export const MyQuizzes: React.FC = () => {
  const navigate = useNavigate();
  const { quizzes, loading, loadQuizzes, deleteQuiz, duplicateQuiz } = useQuizStore();
  const setSelectedQuiz = useGameStore((s) => s.setSelectedQuiz);

  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const subjects = Array.from(new Set(quizzes.map((q) => q.subject).filter(Boolean)));

  const filteredQuizzes = quizzes.filter((q) => {
    const matchesSearch = q.name.toLowerCase().includes(search.toLowerCase()) ||
      (q.theme && q.theme.toLowerCase().includes(search.toLowerCase())) ||
      (q.description && q.description.toLowerCase().includes(search.toLowerCase()));
    const matchesSubject = subjectFilter ? q.subject === subjectFilter : true;
    return matchesSearch && matchesSubject;
  });

  const handlePlay = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    navigate('/game/setup');
  };

  const handleDuplicate = async (quiz: Quiz) => {
    try {
      await duplicateQuiz(quiz.id);
      loadQuizzes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!quizToDelete) return;
    try {
      await deleteQuiz(quizToDelete.id);
      setQuizToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async (quiz: Quiz) => {
    try {
      const data = await api.quiz.exportQuiz(quiz.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quiz.name.toLowerCase().replace(/\s+/g, '_')}.hootka`;
      a.click();
      URL.revokeObjectURL(url);
      setExportNotice(`Quiz "${quiz.name}" exportado com sucesso!`);
      setTimeout(() => setExportNotice(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <NeoBrutalistButton variant="ghost" size="sm" onClick={() => navigate('/')}>
            ← VOLTAR
          </NeoBrutalistButton>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>
            Meus Quizzes
          </h1>
        </div>
        <NeoBrutalistButton variant="primary" size="md" onClick={() => navigate('/quiz/new')}>
          + CRIAR QUIZ
        </NeoBrutalistButton>
      </div>

      {exportNotice && (
        <div style={{ background: 'var(--color-accent)', border: '3px solid #0A0A0A', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontWeight: 700, boxShadow: '4px 4px 0 #0A0A0A' }}>
          ✅ {exportNotice}
        </div>
      )}

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por título, tema ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="neo-input"
          style={{ flex: 1, minWidth: '260px', padding: '0.75rem 1rem', fontSize: '1rem', fontWeight: 600 }}
        />
        {subjects.length > 0 && (
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="neo-input"
            style={{ padding: '0.75rem 1rem', fontSize: '1rem', fontWeight: 700, minWidth: '180px' }}
          >
            <option value="">Todas as disciplinas</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        )}
      </div>

      {/* Quizzes Grid */}
      {loading ? (
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700 }}>Carregando quizzes...</p>
      ) : filteredQuizzes.length === 0 ? (
        <NeoBrutalistCard style={{ padding: '3rem', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem' }}>📋</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, marginTop: '1rem' }}>Nenhum quiz encontrado</h2>
          <p style={{ color: '#555', marginBottom: '1.5rem' }}>Comece criando seu primeiro quiz ou importando de uma planilha!</p>
          <NeoBrutalistButton variant="primary" size="md" onClick={() => navigate('/quiz/new')}>
            CRIAR PRIMEIRO QUIZ
          </NeoBrutalistButton>
        </NeoBrutalistCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {filteredQuizzes.map((quiz) => (
            <motion.div key={quiz.id} layout initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <NeoBrutalistCard style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.75rem' }}>📝</span>
                    <NeoBrutalistBadge variant="secondary">
                      {quiz.question_count ?? 0} QUESTÕES
                    </NeoBrutalistBadge>
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.35rem', margin: '0 0 0.5rem', lineHeight: 1.2 }}>
                    {quiz.name}
                  </h3>

                  {quiz.description && (
                    <p style={{ fontSize: '0.875rem', color: '#444', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {quiz.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {quiz.subject && <NeoBrutalistBadge variant="primary">{quiz.subject}</NeoBrutalistBadge>}
                    {quiz.grade && <NeoBrutalistBadge variant="accent">{quiz.grade}</NeoBrutalistBadge>}
                    {quiz.theme && <NeoBrutalistBadge variant="warning">{quiz.theme}</NeoBrutalistBadge>}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ borderTop: '2px solid #0A0A0A', paddingTop: '1rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <NeoBrutalistButton variant="primary" size="sm" onClick={() => handlePlay(quiz)}>
                      ▶ JOGAR
                    </NeoBrutalistButton>
                    <NeoBrutalistButton variant="ghost" size="sm" onClick={() => navigate(`/quiz/${quiz.id}/edit`)}>
                      ✏ EDITAR
                    </NeoBrutalistButton>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem' }}>
                    <NeoBrutalistButton variant="ghost" size="sm" onClick={() => handleDuplicate(quiz)}>
                      DUPLICAR
                    </NeoBrutalistButton>
                    <NeoBrutalistButton variant="ghost" size="sm" onClick={() => handleExport(quiz)}>
                      EXPORTAR
                    </NeoBrutalistButton>
                    <NeoBrutalistButton variant="danger" size="sm" onClick={() => setQuizToDelete(quiz)}>
                      EXCLUIR
                    </NeoBrutalistButton>
                  </div>
                </div>
              </NeoBrutalistCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <NeoBrutalistModal
        isOpen={Boolean(quizToDelete)}
        onClose={() => setQuizToDelete(null)}
        title="EXCLUIR QUIZ"
      >
        <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>
          Tem certeza que deseja excluir o quiz <strong>"{quizToDelete?.name}"</strong>? Esta ação não pode ser desfeita.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <NeoBrutalistButton variant="ghost" size="md" onClick={() => setQuizToDelete(null)}>
            CANCELAR
          </NeoBrutalistButton>
          <NeoBrutalistButton variant="danger" size="md" onClick={handleDelete}>
            SIM, EXCLUIR
          </NeoBrutalistButton>
        </div>
      </NeoBrutalistModal>
    </div>
  );
};

export default MyQuizzes;
