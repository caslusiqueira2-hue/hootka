import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Question } from '@/types';
import NeoBrutalistButton from '@/components/ui/NeoBrutalistButton';
import NeoBrutalistCard from '@/components/ui/NeoBrutalistCard';
import NeoBrutalistBadge from '@/components/ui/NeoBrutalistBadge';
import NeoBrutalistModal from '@/components/ui/NeoBrutalistModal';

export const CreateQuiz: React.FC = () => {
  const navigate = useNavigate();

  // Quiz info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [theme, setTheme] = useState('');

  // Questions in draft
  const [questions, setQuestions] = useState<Omit<Question, 'id' | 'quiz_id'>[]>([]);

  // Question modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Question form
  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [timeSeconds, setTimeSeconds] = useState(30);
  const [basePoints, setBasePoints] = useState(100);
  const [isSpecial, setIsSpecial] = useState(false);
  const [isWildcard, setIsWildcard] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetQuestionForm = () => {
    setQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectAnswer('A');
    setTimeSeconds(30);
    setBasePoints(100);
    setIsSpecial(false);
    setIsWildcard(false);
    setEditingIndex(null);
  };

  const openAddModal = () => {
    resetQuestionForm();
    setIsModalOpen(true);
  };

  const openEditModal = (idx: number) => {
    const q = questions[idx];
    setQText(q.text);
    setOptA(q.option_a);
    setOptB(q.option_b);
    setOptC(q.option_c);
    setOptD(q.option_d);
    setCorrectAnswer(q.correct_answer);
    setTimeSeconds(q.time_seconds);
    setBasePoints(q.base_points);
    setIsSpecial(Boolean(q.is_special));
    setIsWildcard(Boolean(q.is_wildcard));
    setEditingIndex(idx);
    setIsModalOpen(true);
  };

  const handleSaveQuestion = () => {
    if (!qText.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      alert('Por favor, preencha o enunciado e as 4 alternativas.');
      return;
    }

    const questionData: Omit<Question, 'id' | 'quiz_id'> = {
      text: qText.trim(),
      option_a: optA.trim(),
      option_b: optB.trim(),
      option_c: optC.trim(),
      option_d: optD.trim(),
      correct_answer: correctAnswer,
      time_seconds: timeSeconds,
      base_points: basePoints,
      is_special: isSpecial ? 1 : 0,
      is_wildcard: isWildcard ? 1 : 0,
      order_index: editingIndex !== null ? editingIndex : questions.length,
    };

    if (editingIndex !== null) {
      const updated = [...questions];
      updated[editingIndex] = questionData;
      setQuestions(updated);
    } else {
      setQuestions([...questions, questionData]);
    }

    setIsModalOpen(false);
    resetQuestionForm();
  };

  const handleDeleteQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSaveQuiz = async () => {
    if (!name.trim()) {
      setError('O nome do quiz é obrigatório!');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { id: quizId } = await api.quiz.create({
        name: name.trim(),
        description: description.trim(),
        subject: subject.trim(),
        grade: grade.trim(),
        theme: theme.trim(),
      });

      if (questions.length > 0) {
        await api.question.importBatch(quizId, questions);
      }

      navigate('/quizzes');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar o quiz.');
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <NeoBrutalistButton variant="ghost" size="sm" onClick={() => navigate('/quizzes')}>
            ← VOLTAR
          </NeoBrutalistButton>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', fontWeight: 900, margin: 0 }}>
            CRIAR NOVO QUIZ
          </h1>
        </div>
        <NeoBrutalistButton variant="primary" size="md" onClick={handleSaveQuiz} disabled={saving}>
          {saving ? 'SALVANDO...' : 'SALVAR QUIZ ✓'}
        </NeoBrutalistButton>
      </div>

      {error && (
        <div style={{ background: '#FF1744', color: 'white', border: '3px solid #0A0A0A', padding: '1rem', fontWeight: 700, marginBottom: '1.5rem', boxShadow: '4px 4px 0 #0A0A0A' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Quiz Details Card */}
      <NeoBrutalistCard style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.35rem', marginTop: 0, marginBottom: '1.25rem' }}>
          1. INFORMAÇÕES BÁSICAS
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', fontFamily: 'var(--font-heading)' }}>
              NOME DO QUIZ *
            </label>
            <input
              type="text"
              className="neo-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Revolução Francesa - Revisão Geral"
              style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '1.1rem', fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', fontFamily: 'var(--font-heading)' }}>
              DESCRIÇÃO (OPCIONAL)
            </label>
            <textarea
              className="neo-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve resumo dos tópicos abordados neste quiz..."
              rows={2}
              style={{ width: '100%', padding: '0.75rem 1rem', fontSize: '1rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', fontFamily: 'var(--font-heading)' }}>
                DISCIPLINA
              </label>
              <input
                type="text"
                className="neo-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: História, Língua Portuguesa"
                style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '1rem', fontWeight: 600 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', fontFamily: 'var(--font-heading)' }}>
                ANO / SÉRIE
              </label>
              <input
                type="text"
                className="neo-input"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Ex: 8º Ano, 3º Médio"
                style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '1rem', fontWeight: 600 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.4rem', fontFamily: 'var(--font-heading)' }}>
                TEMA / ASSUNTO
              </label>
              <input
                type="text"
                className="neo-input"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Ex: Iluminismo, Crase"
                style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '1rem', fontWeight: 600 }}
              />
            </div>
          </div>
        </div>
      </NeoBrutalistCard>

      {/* Questions Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem', margin: 0 }}>
          2. QUESTÕES ({questions.length})
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <NeoBrutalistButton variant="primary" size="sm" onClick={openAddModal}>
            + ADICIONAR QUESTÃO
          </NeoBrutalistButton>
        </div>
      </div>

      {questions.length === 0 ? (
        <NeoBrutalistCard style={{ padding: '2.5rem', textAlign: 'center', background: '#FFFDF9' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem' }}>Nenhuma questão adicionada ainda.</p>
          <NeoBrutalistButton variant="primary" size="md" onClick={openAddModal}>
            ADICIONAR PRIMEIRA QUESTÃO
          </NeoBrutalistButton>
        </NeoBrutalistCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {questions.map((q, idx) => (
            <NeoBrutalistCard key={idx} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <NeoBrutalistBadge variant="secondary">QUESTÃO #{idx + 1}</NeoBrutalistBadge>
                  <NeoBrutalistBadge variant="primary">{q.time_seconds}s</NeoBrutalistBadge>
                  <NeoBrutalistBadge variant="accent">{q.base_points} pts</NeoBrutalistBadge>
                  {Boolean(q.is_special) && <NeoBrutalistBadge variant="warning">⭐ ESPECIAL</NeoBrutalistBadge>}
                  {Boolean(q.is_wildcard) && <NeoBrutalistBadge variant="danger">⚡ VIRADA</NeoBrutalistBadge>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <NeoBrutalistButton variant="ghost" size="sm" onClick={() => openEditModal(idx)}>
                    EDITAR
                  </NeoBrutalistButton>
                  <NeoBrutalistButton variant="danger" size="sm" onClick={() => handleDeleteQuestion(idx)}>
                    EXCLUIR
                  </NeoBrutalistButton>
                </div>
              </div>

              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.15rem', margin: '0 0 1rem' }}>
                {q.text}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                {[
                  { letter: 'A', text: q.option_a },
                  { letter: 'B', text: q.option_b },
                  { letter: 'C', text: q.option_c },
                  { letter: 'D', text: q.option_d },
                ].map((opt) => {
                  const isCorrect = q.correct_answer === opt.letter;
                  return (
                    <div
                      key={opt.letter}
                      style={{
                        padding: '0.6rem 0.8rem',
                        border: '2px solid #0A0A0A',
                        background: isCorrect ? '#00C851' : '#FFFFFF',
                        color: isCorrect ? '#FFFFFF' : '#0A0A0A',
                        fontWeight: isCorrect ? 800 : 600,
                        fontSize: '0.9rem',
                        display: 'flex',
                        gap: '0.5rem',
                      }}
                    >
                      <span><strong>{opt.letter})</strong></span>
                      <span>{opt.text}</span>
                    </div>
                  );
                })}
              </div>
            </NeoBrutalistCard>
          ))}
        </div>
      )}

      {/* Question Form Modal */}
      <NeoBrutalistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIndex !== null ? `EDITAR QUESTÃO #${editingIndex + 1}` : 'NOVA QUESTÃO'}
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.3rem' }}>
              ENUNCIADO DA QUESTÃO *
            </label>
            <textarea
              className="neo-input"
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="Digite a pergunta completa..."
              rows={3}
              style={{ width: '100%', padding: '0.75rem', fontSize: '1.05rem', fontWeight: 600 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.3rem' }}>
                ALTERNATIVA A *
              </label>
              <input
                type="text"
                className="neo-input"
                value={optA}
                onChange={(e) => setOptA(e.target.value)}
                placeholder="Texto da alternativa A"
                style={{ width: '100%', padding: '0.6rem', fontWeight: 600 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.3rem' }}>
                ALTERNATIVA B *
              </label>
              <input
                type="text"
                className="neo-input"
                value={optB}
                onChange={(e) => setOptB(e.target.value)}
                placeholder="Texto da alternativa B"
                style={{ width: '100%', padding: '0.6rem', fontWeight: 600 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.3rem' }}>
                ALTERNATIVA C *
              </label>
              <input
                type="text"
                className="neo-input"
                value={optC}
                onChange={(e) => setOptC(e.target.value)}
                placeholder="Texto da alternativa C"
                style={{ width: '100%', padding: '0.6rem', fontWeight: 600 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.3rem' }}>
                ALTERNATIVA D *
              </label>
              <input
                type="text"
                className="neo-input"
                value={optD}
                onChange={(e) => setOptD(e.target.value)}
                placeholder="Texto da alternativa D"
                style={{ width: '100%', padding: '0.6rem', fontWeight: 600 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.3rem' }}>
                RESPOSTA CORRETA
              </label>
              <select
                className="neo-input"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value as any)}
                style={{ width: '100%', padding: '0.6rem', fontWeight: 800, fontSize: '1rem' }}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.3rem' }}>
                TEMPO
              </label>
              <select
                className="neo-input"
                value={timeSeconds}
                onChange={(e) => setTimeSeconds(Number(e.target.value))}
                style={{ width: '100%', padding: '0.6rem', fontWeight: 800 }}
              >
                <option value={10}>10 segundos</option>
                <option value={15}>15 segundos</option>
                <option value={20}>20 segundos</option>
                <option value={30}>30 segundos</option>
                <option value={45}>45 segundos</option>
                <option value={60}>60 segundos</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.3rem' }}>
                PONTOS
              </label>
              <select
                className="neo-input"
                value={basePoints}
                onChange={(e) => setBasePoints(Number(e.target.value))}
                style={{ width: '100%', padding: '0.6rem', fontWeight: 800 }}
              >
                <option value={100}>100 pontos</option>
                <option value={150}>150 pontos</option>
                <option value={200}>200 pontos</option>
                <option value={300}>300 pontos</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={isSpecial}
                onChange={(e) => setIsSpecial(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              ⭐ Questão Especial (+50% bônus)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={isWildcard}
                onChange={(e) => setIsWildcard(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              ⚡ Questão de Virada (pontuação dobrada)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <NeoBrutalistButton variant="ghost" size="md" onClick={() => setIsModalOpen(false)}>
              CANCELAR
            </NeoBrutalistButton>
            <NeoBrutalistButton variant="primary" size="md" onClick={handleSaveQuestion}>
              SALVAR QUESTÃO
            </NeoBrutalistButton>
          </div>
        </div>
      </NeoBrutalistModal>
    </div>
  );
};

export default CreateQuiz;
