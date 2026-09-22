/**
 * questionParser.ts — Intelligent Batch Parser for Quiz Questions
 * 
 * Supports:
 * 1. Natural Language / AI blocks (ChatGPT, Claude, Word, Exams)
 *    e.g.
 *    1. Qual é a capital do Brasil?
 *    A) São Paulo
 *    B) Rio de Janeiro
 *    C) Brasília
 *    D) Salvador
 *    Resposta: C
 * 
 * 2. Delimited lines (Pipe `|` or Semicolon `;` or Tab `\t`)
 *    e.g. Pergunta | Opção A | Opção B | Opção C | Opção D | C | 30 | 100
 * 
 * 3. JSON Array of questions
 */

import Papa from 'papaparse';

export interface ParsedQuestion {
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  time_seconds: number;
  base_points: number;
  is_special: number;
  is_wildcard: number;
}

export const CHATGPT_PROMPT_TEMPLATE = `Atue como um professor especialista e crie 10 questões de múltipla escolha sobre [ASSUNTO/DISCIPLINA] para alunos do [ANO/SÉRIE].

Cada questão DEVE ter exatamente 4 alternativas (A, B, C, D) e indicar o gabarito. Siga ESTRITAMENTE o formato abaixo para cada questão:

1. [Enunciado da pergunta claro e objetivo]
A) [Alternativa A]
B) [Alternativa B]
C) [Alternativa C]
D) [Alternativa D]
Resposta: [A, B, C ou D]
Tempo: 30
Pontos: 100

(Deixe uma linha em branco entre cada questão)`;

export const SAMPLE_QUESTIONS_TEXT = `1. Qual é a capital do Brasil?
A) São Paulo
B) Rio de Janeiro
C) Brasília
D) Salvador
Resposta: C
Tempo: 20
Pontos: 100

2. Qual é a maior floresta tropical do planeta?
A) Floresta do Congo
B) Floresta Amazônica
C) Mata Atlântica
D) Taiga Siberiana
Resposta: B
Tempo: 25
Pontos: 100

3. Quantos planetas compõem o Sistema Solar atualmente?
A) 7
B) 8
C) 9
D) 10
Resposta: B
Tempo: 20
Pontos: 100

4. ? QUESTÃO ESPECIAL: Quem é considerado o Pai da Aviação no Brasil?
A) Santos Dumont
B) Irmãos Wright
C) Graham Bell
D) Barão de Mauá
Resposta: A
Tempo: 30
Pontos: 200`;

export function parseBatchQuestions(rawInput: string): { questions: ParsedQuestion[]; error?: string } {
  const text = (rawInput || '').trim();
  if (!text) {
    return { questions: [] };
  }

  // 1. JSON Array format
  if ((text.startsWith('[') && text.endsWith(']')) || (text.startsWith('{') && text.endsWith('}'))) {
    try {
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : parsed.questions || parsed.data || [];
      if (Array.isArray(arr) && arr.length > 0) {
        const questions: ParsedQuestion[] = [];
        for (const item of arr) {
          const qText = String(item.text || item.pergunta || item.enunciado || item.question || '').trim();
          const optA = String(item.option_a || item.alternativa_a || item.a || item.A || '').trim();
          const optB = String(item.option_b || item.alternativa_b || item.b || item.B || '').trim();
          const optC = String(item.option_c || item.alternativa_c || item.c || item.C || '').trim();
          const optD = String(item.option_d || item.alternativa_d || item.d || item.D || '').trim();
          const rawAns = String(item.correct_answer || item.resposta || item.correta || item.gabarito || 'A').toUpperCase().trim();
          const ans: 'A' | 'B' | 'C' | 'D' = ['A', 'B', 'C', 'D'].includes(rawAns.charAt(0)) ? (rawAns.charAt(0) as any) : 'A';
          const time = Number(item.time_seconds || item.tempo || 30) || 30;
          const points = Number(item.base_points || item.pontos || 100) || 100;

          if (qText && optA && optB) {
            questions.push({
              text: qText,
              option_a: optA,
              option_b: optB,
              option_c: optC || 'N/A',
              option_d: optD || 'N/A',
              correct_answer: ans,
              time_seconds: time,
              base_points: points,
              is_special: points >= 200 ? 1 : 0,
              is_wildcard: points >= 300 ? 1 : 0,
            });
          }
        }
        if (questions.length > 0) return { questions };
      }
    } catch {
      // Not valid JSON, continue with other parsers
    }
  }

  // 2. Delimited Lines Format (| or ; or \t)
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const isPipe = lines.filter((l) => l.includes('|')).length >= 2;
  const isSemicolon = lines.filter((l) => l.includes(';')).length >= 2;
  const isTab = lines.filter((l) => l.includes('\t')).length >= 2;

  if (isPipe || isSemicolon || isTab) {
    const delimiter = isPipe ? '|' : isSemicolon ? ';' : '\t';
    const questions: ParsedQuestion[] = [];

    for (const line of lines) {
      const parts = line.split(delimiter).map((p) => p.trim());
      if (parts.length >= 5) {
        const lowerFirst = parts[0].toLowerCase();
        if (lowerFirst.includes('pergunta') || lowerFirst.includes('enunciado') || lowerFirst === 'text') {
          continue; // Skip header
        }

        const qText = parts[0];
        const optA = parts[1];
        const optB = parts[2];
        const optC = parts[3] || 'N/A';
        const optD = parts[4] || 'N/A';
        const rawAns = (parts[5] || 'A').toUpperCase().trim();
        const ans: 'A' | 'B' | 'C' | 'D' = ['A', 'B', 'C', 'D'].includes(rawAns.charAt(0)) ? (rawAns.charAt(0) as any) : 'A';
        const time = Number(parts[6]) || 30;
        const points = Number(parts[7]) || 100;

        if (qText && optA && optB) {
          questions.push({
            text: qText,
            option_a: optA,
            option_b: optB,
            option_c: optC,
            option_d: optD,
            correct_answer: ans,
            time_seconds: time,
            base_points: points,
            is_special: points >= 200 ? 1 : 0,
            is_wildcard: points >= 300 ? 1 : 0,
          });
        }
      }
    }

    if (questions.length > 0) {
      return { questions };
    }
  }

  // 3. Natural Text / Exam / AI Format (Blocks separated by blank lines or numbers)
  // Split on double newlines OR split on lines starting with question numbers like "1.", "Questão 2:"
  let blocks = text.split(/\n\s*\n+/);
  
  // If only 1 block was found, try splitting by line beginning with numbers
  if (blocks.length === 1) {
    const matchQuestions = text.split(/(?=(?:^|\n)\s*(?:quest[aã]o\s*)?\d+[\.\)\:\-]\s*)/i);
    if (matchQuestions.length > 1) {
      blocks = matchQuestions.filter((b) => b.trim().length > 0);
    }
  }

  const questions: ParsedQuestion[] = [];

  for (const block of blocks) {
    const rawLines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (rawLines.length < 3) continue;

    let qText = '';
    let optA = '', optB = '', optC = '', optD = '';
    let correct: 'A' | 'B' | 'C' | 'D' = 'A';
    let time = 30;
    let points = 100;

    let readingQuestion = true;

    for (const line of rawLines) {
      // Check for answer declaration: "Resposta: C", "Gabarito: B", "Correta: A"
      const matchAnswer = line.match(/(?:resposta|gabarito|correta|resp|ans(?:wer)?)\s*[:\-\=]?\s*([A-Da-d])/i);
      if (matchAnswer) {
        correct = matchAnswer[1].toUpperCase() as any;
        continue;
      }

      // Check for time: "Tempo: 25"
      const matchTime = line.match(/tempo\s*[:\-\=]?\s*(\d+)/i);
      if (matchTime) {
        time = parseInt(matchTime[1], 10);
        continue;
      }

      // Check for points: "Pontos: 200"
      const matchPoints = line.match(/pontos?\s*[:\-\=]?\s*(\d+)/i);
      if (matchPoints) {
        points = parseInt(matchPoints[1], 10);
        continue;
      }

      // Check for option line: A) Opção, A. Opção, [A] Opção, (A) Opção, *A) Opção
      const matchOpt = line.match(/^(\*)?\s*(?:\[|\()?([A-Da-d])(?:\]|\)|\.|\:|\-)\s*(.*)$/);
      if (matchOpt) {
        readingQuestion = false;
        const isStarred = Boolean(matchOpt[1]);
        const letter = matchOpt[2].toUpperCase();
        let content = matchOpt[3].trim();

        // Check if marked as correct in the option itself (e.g. "Brasília (correta)" or "[x]")
        if (isStarred || content.toLowerCase().includes('(correta)') || content.toLowerCase().includes('[correta]') || content.toLowerCase().includes('(gabarito)')) {
          correct = letter as any;
          content = content.replace(/\((?:correta|correto|gabarito)\)/gi, '').replace(/\[(?:correta|correto|gabarito)\]/gi, '').trim();
        }

        if (letter === 'A') optA = content;
        else if (letter === 'B') optB = content;
        else if (letter === 'C') optC = content;
        else if (letter === 'D') optD = content;
        continue;
      }

      // Still reading question header
      if (readingQuestion) {
        // Remove question prefix e.g. "1. ", "Questão 1: "
        const cleaned = line.replace(/^(?:quest[aã]o\s*)?\d+[\.\)\:\-]\s*/i, '');
        qText += (qText ? ' ' : '') + cleaned;
      }
    }

    if (qText && optA && optB) {
      questions.push({
        text: qText,
        option_a: optA,
        option_b: optB,
        option_c: optC || 'N/A',
        option_d: optD || 'N/A',
        correct_answer: correct,
        time_seconds: time,
        base_points: points,
        is_special: points >= 200 ? 1 : 0,
        is_wildcard: points >= 300 ? 1 : 0,
      });
    }
  }

  if (questions.length > 0) {
    return { questions };
  }

  // 4. Fallback: Try CSV parser via PapaParse
  try {
    const csvResult = Papa.parse(text, { header: true, skipEmptyLines: true });
    if (csvResult.data && csvResult.data.length > 0) {
      const csvQuestions: ParsedQuestion[] = [];
      for (const row of csvResult.data as any[]) {
        const qText = String(row.pergunta || row.Pergunta || row.enunciado || row.question || row.text || '').trim();
        const optA = String(row.alternativa_a || row.alternativaA || row.A || row.a || '').trim();
        const optB = String(row.alternativa_b || row.alternativaB || row.B || row.b || '').trim();
        const optC = String(row.alternativa_c || row.alternativaC || row.C || row.c || '').trim();
        const optD = String(row.alternativa_d || row.alternativaD || row.D || row.d || '').trim();
        const rawAns = String(row.resposta || row.Resposta || row.correta || row.correct || 'A').toUpperCase().trim();
        const ans: 'A' | 'B' | 'C' | 'D' = ['A', 'B', 'C', 'D'].includes(rawAns.charAt(0)) ? (rawAns.charAt(0) as any) : 'A';
        const time = Number(row.tempo || row.Tempo || 30) || 30;
        const points = Number(row.pontos || row.Pontos || 100) || 100;

        if (qText && optA && optB) {
          csvQuestions.push({
            text: qText,
            option_a: optA,
            option_b: optB,
            option_c: optC || 'N/A',
            option_d: optD || 'N/A',
            correct_answer: ans,
            time_seconds: time,
            base_points: points,
            is_special: points >= 200 ? 1 : 0,
            is_wildcard: points >= 300 ? 1 : 0,
          });
        }
      }
      if (csvQuestions.length > 0) {
        return { questions: csvQuestions };
      }
    }
  } catch {}

  return {
    questions: [],
    error: 'Nenhuma questão válida foi identificada. Verifique se o formato possui enunciado e as opções A, B, C e D.',
  };
}
