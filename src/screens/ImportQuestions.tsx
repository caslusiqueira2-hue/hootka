import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { api } from '@/lib/api';
import type { Question } from '@/types';
import NeoBrutalistButton from '@/components/ui/NeoBrutalistButton';
import NeoBrutalistCard from '@/components/ui/NeoBrutalistCard';
import NeoBrutalistBadge from '@/components/ui/NeoBrutalistBadge';
import {
  parseBatchQuestions,
  CHATGPT_PROMPT_TEMPLATE,
  SAMPLE_QUESTIONS_TEXT,
} from '@/lib/questionParser';

interface ParsedRow {
  index: number;
  pergunta: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  resposta: string;
  tempo: number;
  pontos: number;
  isValid: boolean;
  errors: string[];
}

export const ImportQuestions: React.FC = () => {
  const { id: quizId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'ai' | 'file' | 'text'>('ai');
  const [pasteText, setPasteText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const validateRow = (row: any, index: number): ParsedRow => {
    const errors: string[] = [];

    const pergunta = String(row.pergunta || row.Pergunta || row.enunciado || row.question || '').trim();
    const altA = String(row.alternativa_a || row.alternativaA || row.A || row.a || '').trim();
    const altB = String(row.alternativa_b || row.alternativaB || row.B || row.b || '').trim();
    const altC = String(row.alternativa_c || row.alternativaC || row.C || row.c || '').trim();
    const altD = String(row.alternativa_d || row.alternativaD || row.D || row.d || '').trim();
    const resp = String(row.resposta || row.Resposta || row.correta || row.correct || '').trim().toUpperCase();
    const tempo = Number(row.tempo || row.Tempo || 30) || 30;
    const pontos = Number(row.pontos || row.Pontos || 100) || 100;

    if (!pergunta) errors.push('Pergunta vazia');
    if (!altA) errors.push('Alternativa A vazia');
    if (!altB) errors.push('Alternativa B vazia');
    if (!altC) errors.push('Alternativa C vazia');
    if (!altD) errors.push('Alternativa D vazia');
    if (!['A', 'B', 'C', 'D'].includes(resp)) errors.push('Resposta deve ser A, B, C ou D');

    return {
      index,
      pergunta,
      alternativa_a: altA,
      alternativa_b: altB,
      alternativa_c: altC,
      alternativa_d: altD,
      resposta: resp,
      tempo,
      pontos,
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const validated = results.data.map((row: any, i: number) => validateRow(row, i + 1));
          setParsedRows(validated);
        },
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws);
        const validated = data.map((row: any, i: number) => validateRow(row, i + 1));
        setParsedRows(validated);
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleParsePaste = () => {
    if (!pasteText.trim()) return;

    // 1. Try intelligent multi-format / exam / ChatGPT parser
    const batchRes = parseBatchQuestions(pasteText);
    if (batchRes.questions.length > 0) {
      const validated: ParsedRow[] = batchRes.questions.map((q, i) => ({
        index: i + 1,
        pergunta: q.text,
        alternativa_a: q.option_a,
        alternativa_b: q.option_b,
        alternativa_c: q.option_c,
        alternativa_d: q.option_d,
        resposta: q.correct_answer,
        tempo: q.time_seconds,
        pontos: q.base_points,
        isValid: true,
        errors: [],
      }));
      setParsedRows(validated);
      return;
    }

    // 2. Fallback to Papa.parse for raw CSV
    Papa.parse(pasteText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validated = results.data.map((row: any, i: number) => validateRow(row, i + 1));
        setParsedRows(validated);
      },
    });
  };

  const handleLoadSample = () => {
    setPasteText(SAMPLE_QUESTIONS_TEXT);
    const res = parseBatchQuestions(SAMPLE_QUESTIONS_TEXT);
    const validated: ParsedRow[] = res.questions.map((q, i) => ({
      index: i + 1,
      pergunta: q.text,
      alternativa_a: q.option_a,
      alternativa_b: q.option_b,
      alternativa_c: q.option_c,
      alternativa_d: q.option_d,
      resposta: q.correct_answer,
      tempo: q.time_seconds,
      pontos: q.base_points,
      isValid: true,
      errors: [],
    }));
    setParsedRows(validated);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(CHATGPT_PROMPT_TEMPLATE);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const validQuestions = parsedRows.filter((r) => r.isValid);
  const errorQuestions = parsedRows.filter((r) => !r.isValid);

  const handleImport = async () => {
    if (!quizId || validQuestions.length === 0) return;

    setImporting(true);
    try {
      const payload: Omit<Question, 'id' | 'quiz_id'>[] = validQuestions.map((r, i) => ({
        text: r.pergunta,
        option_a: r.alternativa_a,
        option_b: r.alternativa_b,
        option_c: r.alternativa_c,
        option_d: r.alternativa_d,
        correct_answer: r.resposta as any,
        time_seconds: r.tempo,
        base_points: r.pontos,
        is_special: r.pontos >= 200 ? 1 : 0,
        is_wildcard: r.pontos >= 300 ? 1 : 0,
        order_index: i,
      }));

      await api.question.importBatch(quizId, payload);
      setImportSuccess(`${payload.length} questões importadas com sucesso!`);
      setTimeout(() => {
        navigate(`/quiz/${quizId}/edit`);
      }, 1500);
    } catch (err: any) {
      alert('Erro ao importar questões: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <NeoBrutalistButton variant="ghost" size="sm" onClick={() => navigate(-1)}>
            ← VOLTAR
          </NeoBrutalistButton>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.25rem', fontWeight: 900, margin: 0 }}>
            IMPORTAÇÃO EM LOTE
          </h1>
        </div>
      </div>

      {importSuccess && (
        <div style={{ background: '#00C851', color: 'white', border: '3px solid #0A0A0A', padding: '1rem', fontWeight: 800, marginBottom: '1.5rem', boxShadow: '4px 4px 0 #0A0A0A' }}>
          ✅ {importSuccess}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <NeoBrutalistButton
          variant={activeTab === 'ai' ? 'primary' : 'ghost'}
          size="md"
          onClick={() => setActiveTab('ai')}
        >
          🤖 IA / TEXTO LIVRE (CHATGPT / PROVAS)
        </NeoBrutalistButton>
        <NeoBrutalistButton
          variant={activeTab === 'file' ? 'primary' : 'ghost'}
          size="md"
          onClick={() => setActiveTab('file')}
        >
          📁 ARQUIVO (CSV / XLSX)
        </NeoBrutalistButton>
        <NeoBrutalistButton
          variant={activeTab === 'text' ? 'primary' : 'ghost'}
          size="md"
          onClick={() => setActiveTab('text')}
        >
          📋 TABELADO / DELIMITADO (| ou ;)
        </NeoBrutalistButton>
      </div>

      {/* Tab 1: AI / Free Text / Word */}
      {activeTab === 'ai' && (
        <NeoBrutalistCard style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <label style={{ display: 'block', fontWeight: 900, fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>
                COLE QUESTÕES NO FORMATO NATURAL OU GERADAS POR IA:
              </label>
              <span style={{ fontSize: '0.85rem', color: '#555' }}>
                Reconhece automaticamente números, opções A/B/C/D e gabaritos.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={handleCopyPrompt}
                style={{
                  background: '#FFD600',
                  border: '2px solid #0A0A0A',
                  boxShadow: '2px 2px 0 #0A0A0A',
                  padding: '0.4rem 0.75rem',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                {copiedPrompt ? '✅ PROMPT COPIADO!' : '🤖 COPIAR PROMPT P/ CHATGPT'}
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
                ✨ CARREGAR EXEMPLO
              </button>
            </div>
          </div>

          <textarea
            className="neo-input"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`1. Qual é a capital do Brasil?\nA) São Paulo\nB) Rio de Janeiro\nC) Brasília\nD) Salvador\nResposta: C\n\n2. Quem escreveu Dom Casmurro?\nA) Machado de Assis\nB) José de Alencar\nC) Clarice Lispector\nD) Carlos Drummond\nResposta: A`}
            rows={8}
            style={{ width: '100%', padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '1rem', resize: 'vertical' }}
          />

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <NeoBrutalistButton variant="primary" size="md" onClick={handleParsePaste}>
              🔍 IDENTIFICAR E PROCESSAR QUESTÕES
            </NeoBrutalistButton>
            {pasteText && (
              <button
                type="button"
                onClick={() => {
                  setPasteText('');
                  setParsedRows([]);
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
        </NeoBrutalistCard>
      )}

      {/* Tab 2: File Upload */}
      {activeTab === 'file' && (
        <NeoBrutalistCard style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
          <input
            type="file"
            id="file-input"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <label
            htmlFor="file-input"
            className="neo-btn neo-btn-primary"
            style={{ display: 'inline-block', cursor: 'pointer', padding: '1rem 2rem', fontSize: '1.1rem', fontWeight: 800 }}
          >
            📂 SELECIONAR ARQUIVO PLANILHA (.CSV OU .XLSX)
          </label>
          {fileName && (
            <p style={{ marginTop: '1rem', fontWeight: 700, fontSize: '1.1rem' }}>
              Arquivo selecionado: <strong>{fileName}</strong>
            </p>
          )}
          <p style={{ color: '#666', fontSize: '0.875rem', marginTop: '1rem' }}>
            Colunas aceitas: <code>pergunta, alternativa_a, alternativa_b, alternativa_c, alternativa_d, resposta, tempo, pontos</code>
          </p>
        </NeoBrutalistCard>
      )}

      {/* Tab 3: Delimited Text */}
      {activeTab === 'text' && (
        <NeoBrutalistCard style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontWeight: 800, marginBottom: '0.5rem' }}>
            COLE LINHAS SEPARADAS POR BARRA (|), PONTO-E-VÍRGULA (;) OU TABULAÇÃO:
          </label>
          <textarea
            className="neo-input"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`Qual a capital do Brasil? | São Paulo | Rio de Janeiro | Brasília | Salvador | C | 30 | 100\nQual o maior planeta? | Terra | Marte | Júpiter | Saturno | C | 30 | 100`}
            rows={6}
            style={{ width: '100%', padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '1rem' }}
          />
          <NeoBrutalistButton variant="secondary" size="md" onClick={handleParsePaste}>
            PROCESSAR LINHAS
          </NeoBrutalistButton>
        </NeoBrutalistCard>
      )}

      {/* Preview Table */}
      {parsedRows.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <NeoBrutalistBadge variant="secondary">TOTAL: {parsedRows.length}</NeoBrutalistBadge>
              <NeoBrutalistBadge variant="success">VÁLIDAS: {validQuestions.length}</NeoBrutalistBadge>
              {errorQuestions.length > 0 && (
                <NeoBrutalistBadge variant="danger">COM ERRO: {errorQuestions.length}</NeoBrutalistBadge>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <NeoBrutalistButton variant="ghost" size="md" onClick={() => setParsedRows([])}>
                LIMPAR
              </NeoBrutalistButton>
              <NeoBrutalistButton
                variant="primary"
                size="md"
                disabled={validQuestions.length === 0 || importing}
                onClick={handleImport}
              >
                {importing ? 'IMPORTANDO...' : `IMPORTAR ${validQuestions.length} QUESTÕES ✓`}
              </NeoBrutalistButton>
            </div>
          </div>

          <div style={{ overflowX: 'auto', border: '3px solid #0A0A0A', background: '#FFFFFF', boxShadow: '6px 6px 0 #0A0A0A' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#0A0A0A', color: '#FFFFFF', fontFamily: 'var(--font-heading)' }}>
                  <th style={{ padding: '0.75rem', border: '1px solid #333' }}>#</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #333' }}>Status</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #333' }}>Pergunta</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #333' }}>A</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #333' }}>B</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #333' }}>C</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #333' }}>D</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #333' }}>Resp</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #333' }}>Tempo</th>
                  <th style={{ padding: '0.75rem', border: '1px solid #333' }}>Pontos</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((r) => (
                  <tr key={r.index} style={{ background: r.isValid ? '#FFFFFF' : '#FFEBEE' }}>
                    <td style={{ padding: '0.6rem', border: '1px solid #DDD', fontWeight: 800 }}>{r.index}</td>
                    <td style={{ padding: '0.6rem', border: '1px solid #DDD' }}>
                      {r.isValid ? (
                        <span style={{ color: '#00C851', fontWeight: 800 }}>✓ Válida</span>
                      ) : (
                        <span style={{ color: '#FF1744', fontWeight: 800 }}>⚠️ {r.errors.join(', ')}</span>
                      )}
                    </td>
                    <td style={{ padding: '0.6rem', border: '1px solid #DDD', fontWeight: 600 }}>{r.pergunta}</td>
                    <td style={{ padding: '0.6rem', border: '1px solid #DDD' }}>{r.alternativa_a}</td>
                    <td style={{ padding: '0.6rem', border: '1px solid #DDD' }}>{r.alternativa_b}</td>
                    <td style={{ padding: '0.6rem', border: '1px solid #DDD' }}>{r.alternativa_c}</td>
                    <td style={{ padding: '0.6rem', border: '1px solid #DDD' }}>{r.alternativa_d}</td>
                    <td style={{ padding: '0.6rem', border: '1px solid #DDD', fontWeight: 900, textAlign: 'center', background: '#F5F0E8' }}>{r.resposta}</td>
                    <td style={{ padding: '0.6rem', border: '1px solid #DDD', textAlign: 'center' }}>{r.tempo}s</td>
                    <td style={{ padding: '0.6rem', border: '1px solid #DDD', textAlign: 'center' }}>{r.pontos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportQuestions;
