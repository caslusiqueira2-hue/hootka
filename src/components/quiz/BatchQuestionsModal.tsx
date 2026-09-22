import React, { useState } from 'react';
import NeoBrutalistModal from '@/components/ui/NeoBrutalistModal';
import NeoBrutalistButton from '@/components/ui/NeoBrutalistButton';
import NeoBrutalistCard from '@/components/ui/NeoBrutalistCard';
import NeoBrutalistBadge from '@/components/ui/NeoBrutalistBadge';
import {
  parseBatchQuestions,
  ParsedQuestion,
  CHATGPT_PROMPT_TEMPLATE,
  SAMPLE_QUESTIONS_TEXT,
} from '@/lib/questionParser';

interface BatchQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestions: (questions: ParsedQuestion[]) => void | Promise<void>;
}

export const BatchQuestionsModal: React.FC<BatchQuestionsModalProps> = ({
  isOpen,
  onClose,
  onAddQuestions,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'delimited'>('text');
  const [inputText, setInputText] = useState('');
  const [previewQuestions, setPreviewQuestions] = useState<ParsedQuestion[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleParse = () => {
    setErrorMessage(null);
    if (!inputText.trim()) {
      setErrorMessage('Cole ou digite o texto das questões antes de processar.');
      setPreviewQuestions([]);
      return;
    }

    const res = parseBatchQuestions(inputText);
    if (res.questions.length > 0) {
      setPreviewQuestions(res.questions);
      setErrorMessage(null);
    } else {
      setPreviewQuestions([]);
      setErrorMessage(res.error || 'Nenhuma questão foi reconhecida. Verifique o formato.');
    }
  };

  const handleLoadSample = () => {
    setInputText(SAMPLE_QUESTIONS_TEXT);
    const res = parseBatchQuestions(SAMPLE_QUESTIONS_TEXT);
    setPreviewQuestions(res.questions);
    setErrorMessage(null);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(CHATGPT_PROMPT_TEMPLATE);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleRemovePreviewItem = (index: number) => {
    setPreviewQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmImport = async () => {
    if (previewQuestions.length === 0) return;
    setProcessing(true);
    try {
      await onAddQuestions(previewQuestions);
      // Reset and close
      setInputText('');
      setPreviewQuestions([]);
      setErrorMessage(null);
      onClose();
    } catch (err: any) {
      setErrorMessage('Erro ao adicionar questões: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <NeoBrutalistModal
      isOpen={isOpen}
      onClose={onClose}
      title="? ADICIONAR QUESTÕES EM LOTE"
      maxWidth="920px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Intro banner */}
        <div
          style={{
            background: '#FFD600',
            border: '2px solid #0A0A0A',
            padding: '0.75rem 1rem',
            boxShadow: '3px 3px 0 #0A0A0A',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '0.95rem' }}>
              ?? Copie de provas, Word, PDFs ou gere direto com IA (ChatGPT / Gemini)!
            </span>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#222' }}>
              O Hootka reconhece automaticamente enunciados, alternativas A/B/C/D e gabaritos.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleCopyPrompt}
              style={{
                background: '#FFFFFF',
                border: '2px solid #0A0A0A',
                boxShadow: '2px 2px 0 #0A0A0A',
                padding: '0.4rem 0.75rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              {copiedPrompt ? '? PROMPT COPIADO!' : '?? COPIAR PROMPT P/ CHATGPT'}
            </button>
            <button
              type="button"
              onClick={handleLoadSample}
              style={{
                background: '#FFFFFF',
                border: '2px solid #0A0A0A',
                boxShadow: '2px 2px 0 #0A0A0A',
                padding: '0.4rem 0.75rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              ? VER EXEMPLO PRONTO
            </button>
          </div>
        </div>

        {/* Format tabs */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            style={{
              flex: 1,
              background: activeTab === 'text' ? '#1A1AFF' : '#FFFFFF',
              color: activeTab === 'text' ? '#FFFFFF' : '#0A0A0A',
              border: '3px solid #0A0A0A',
              boxShadow: activeTab === 'text' ? '3px 3px 0 #0A0A0A' : 'none',
              padding: '0.5rem 1rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: 900,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            ?? TEXTO LIVRE / FORMATO DE PROVA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('delimited')}
            style={{
              flex: 1,
              background: activeTab === 'delimited' ? '#1A1AFF' : '#FFFFFF',
              color: activeTab === 'delimited' ? '#FFFFFF' : '#0A0A0A',
              border: '3px solid #0A0A0A',
              boxShadow: activeTab === 'delimited' ? '3px 3px 0 #0A0A0A' : 'none',
              padding: '0.5rem 1rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: 900,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            ?? TABELA / DELIMITADO (| ou ;)
          </button>
        </div>

        {/* Text area */}
        <div>
          <label
            style={{
              display: 'block',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '0.85rem',
              marginBottom: '0.4rem',
            }}
          >
            {activeTab === 'text'
              ? 'COLE AQUI AS QUESTÕES (Formato: 1. Pergunta / A) ... B) ... / Resposta: X):'
              : 'COLE AQUI LINHAS SEPARADAS POR BARRA OU PONTO-E-VÍRGULA (Pergunta | A | B | C | D | Resposta):'}
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              activeTab === 'text'
                ? `1. Qual é a capital do Brasil?\nA) São Paulo\nB) Rio de Janeiro\nC) Brasília\nD) Salvador\nResposta: C\n\n2. Segunda pergunta...\nA) ...`
                : `Qual a capital do Brasil? | São Paulo | Rio de Janeiro | Brasília | Salvador | C | 30 | 100\nQual o maior oceano? | Atlântico | Pacífico | Índico | Ártico | B | 30 | 100`
            }
            className="neo-input"
            rows={8}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              lineHeight: 1.4,
              resize: 'vertical',
            }}
          />
        </div>

        {/* Parse Action Button */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <NeoBrutalistButton
            variant="secondary"
            size="md"
            onClick={handleParse}
            style={{ flex: 1 }}
          >
            ?? IDENTIFICAR E VISUALIZAR QUESTÕES
          </NeoBrutalistButton>
          {inputText && (
            <button
              type="button"
              onClick={() => {
                setInputText('');
                setPreviewQuestions([]);
                setErrorMessage(null);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#666',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Limpar texto
            </button>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div
            style={{
              background: '#FF1744',
              color: '#FFFFFF',
              border: '3px solid #0A0A0A',
              boxShadow: '3px 3px 0 #0A0A0A',
              padding: '0.75rem',
              fontWeight: 800,
              fontSize: '0.9rem',
            }}
          >
            ?? {errorMessage}
          </div>
        )}

        {/* Preview section */}
        {previewQuestions.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
                borderBottom: '2px solid #0A0A0A',
                paddingBottom: '0.5rem',
              }}
            >
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1rem' }}>
                ?? {previewQuestions.length} QUESTÕES RECONHECIDAS:
              </span>
              <NeoBrutalistBadge variant="success">
                GABARITOS DETECTADOS
              </NeoBrutalistBadge>
            </div>

            <div
              style={{
                maxHeight: '260px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                paddingRight: '0.25rem',
              }}
            >
              {previewQuestions.map((q, idx) => (
                <NeoBrutalistCard
                  key={idx}
                  style={{
                    padding: '0.85rem 1rem',
                    background: '#FAFAFA',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span
                          style={{
                            background: '#0A0A0A',
                            color: '#FFFFFF',
                            padding: '0.1rem 0.4rem',
                            fontWeight: 900,
                            fontSize: '0.75rem',
                          }}
                        >
                          #{idx + 1}
                        </span>
                        <strong style={{ fontSize: '0.95rem' }}>{q.text}</strong>
                      </div>

                      {/* Alternatives preview */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '0.35rem',
                          fontSize: '0.8rem',
                          marginTop: '0.5rem',
                        }}
                      >
                        <div
                          style={{
                            padding: '0.25rem 0.5rem',
                            border: '1px solid #0A0A0A',
                            background: q.correct_answer === 'A' ? '#D4EDDA' : '#FFFFFF',
                            fontWeight: q.correct_answer === 'A' ? 800 : 500,
                          }}
                        >
                          <strong>A:</strong> {q.option_a} {q.correct_answer === 'A' && '?'}
                        </div>
                        <div
                          style={{
                            padding: '0.25rem 0.5rem',
                            border: '1px solid #0A0A0A',
                            background: q.correct_answer === 'B' ? '#D4EDDA' : '#FFFFFF',
                            fontWeight: q.correct_answer === 'B' ? 800 : 500,
                          }}
                        >
                          <strong>B:</strong> {q.option_b} {q.correct_answer === 'B' && '?'}
                        </div>
                        <div
                          style={{
                            padding: '0.25rem 0.5rem',
                            border: '1px solid #0A0A0A',
                            background: q.correct_answer === 'C' ? '#D4EDDA' : '#FFFFFF',
                            fontWeight: q.correct_answer === 'C' ? 800 : 500,
                          }}
                        >
                          <strong>C:</strong> {q.option_c} {q.correct_answer === 'C' && '?'}
                        </div>
                        <div
                          style={{
                            padding: '0.25rem 0.5rem',
                            border: '1px solid #0A0A0A',
                            background: q.correct_answer === 'D' ? '#D4EDDA' : '#FFFFFF',
                            fontWeight: q.correct_answer === 'D' ? 800 : 500,
                          }}
                        >
                          <strong>D:</strong> {q.option_d} {q.correct_answer === 'D' && '?'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.75rem', color: '#666' }}>
                        <span>?? {q.time_seconds}s</span>
                        <span>? {q.base_points} pts</span>
                        {q.is_special === 1 && <span style={{ color: '#E65100', fontWeight: 800 }}>? Especial</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePreviewItem(idx)}
                      title="Remover esta questão do lote"
                      style={{
                        background: '#FFEBEB',
                        border: '1px solid #0A0A0A',
                        padding: '0.2rem 0.45rem',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        color: '#D32F2F',
                      }}
                    >
                      ?
                    </button>
                  </div>
                </NeoBrutalistCard>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '0.5rem',
            borderTop: '2px solid #0A0A0A',
            paddingTop: '1rem',
          }}
        >
          <NeoBrutalistButton variant="ghost" size="md" onClick={onClose} disabled={processing}>
            CANCELAR
          </NeoBrutalistButton>
          <NeoBrutalistButton
            variant="primary"
            size="md"
            onClick={handleConfirmImport}
            disabled={previewQuestions.length === 0 || processing}
            style={{ fontWeight: 900, minWidth: '220px' }}
          >
            {processing
              ? 'ADICIONANDO...'
              : `? ADICIONAR ${previewQuestions.length} QUESTÕES`}
          </NeoBrutalistButton>
        </div>
      </div>
    </NeoBrutalistModal>
  );
};

export default BatchQuestionsModal;
