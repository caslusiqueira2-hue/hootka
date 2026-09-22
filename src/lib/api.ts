// ============================================================
// hootka – Typed API wrapper around window.hootka IPC calls
// ============================================================

import type {
  Quiz, Question, Game, Team, GameQuestion, Answer,
} from '../types';

export const isElectron = typeof window !== 'undefined' && Boolean(window.hootka);

// Browser mock storage keys
const MOCK_QUIZZES_KEY = 'hootka_mock_quizzes';
const MOCK_GAMES_KEY = 'hootka_mock_games';
const MOCK_SETTINGS_KEY = 'hootka_mock_settings';

export const api = {
  quiz: {
    getAll: async (): Promise<Quiz[]> => {
      if (isElectron) return window.hootka.quiz.getAll();
      const raw = localStorage.getItem(MOCK_QUIZZES_KEY);
      if (raw) return JSON.parse(raw);
      const demo: Quiz[] = [
        {
          id: 'demo-quiz-001',
          name: 'Cultura Geral Brasileira',
          description: 'Quiz demonstrativo com 10 questões sobre cultura geral do Brasil',
          subject: 'Cultura Geral',
          grade: '9º Ano',
          theme: 'Brasil',
          question_count: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      localStorage.setItem(MOCK_QUIZZES_KEY, JSON.stringify(demo));
      return demo;
    },
    getById: async (id: string): Promise<Quiz | null> => {
      if (isElectron) return window.hootka.quiz.getById(id);
      const quizzes = await api.quiz.getAll();
      return quizzes.find((q) => q.id === id) || null;
    },
    create: async (data: Partial<Quiz>): Promise<{ id: string }> => {
      if (isElectron) return window.hootka.quiz.create(data);
      const quizzes = await api.quiz.getAll();
      const id = 'quiz-' + Date.now();
      const newQuiz: Quiz = {
        id,
        name: data.name || 'Novo Quiz',
        description: data.description || '',
        subject: data.subject || '',
        grade: data.grade || '',
        theme: data.theme || '',
        question_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      quizzes.unshift(newQuiz);
      localStorage.setItem(MOCK_QUIZZES_KEY, JSON.stringify(quizzes));
      return { id };
    },
    update: async (id: string, data: Partial<Quiz>): Promise<{ success: boolean }> => {
      if (isElectron) return window.hootka.quiz.update(id, data);
      const quizzes = await api.quiz.getAll();
      const idx = quizzes.findIndex((q) => q.id === id);
      if (idx !== -1) {
        quizzes[idx] = { ...quizzes[idx], ...data, updated_at: new Date().toISOString() };
        localStorage.setItem(MOCK_QUIZZES_KEY, JSON.stringify(quizzes));
      }
      return { success: true };
    },
    delete: async (id: string): Promise<{ success: boolean }> => {
      if (isElectron) return window.hootka.quiz.delete(id);
      const quizzes = await api.quiz.getAll();
      const filtered = quizzes.filter((q) => q.id !== id);
      localStorage.setItem(MOCK_QUIZZES_KEY, JSON.stringify(filtered));
      return { success: true };
    },
    duplicate: async (id: string): Promise<{ id: string }> => {
      if (isElectron) return window.hootka.quiz.duplicate(id);
      const q = await api.quiz.getById(id);
      if (!q) return { id: '' };
      return api.quiz.create({ ...q, name: `${q.name} (Cópia)` });
    },
    exportQuiz: async (id: string) => {
      if (isElectron) return window.hootka.quiz.exportQuiz(id);
      const quiz = await api.quiz.getById(id);
      const questions = await api.question.getByQuiz(id);
      return { quiz, questions };
    },
  },

  question: {
    getByQuiz: async (quizId: string): Promise<Question[]> => {
      if (isElectron) return window.hootka.question.getByQuiz(quizId);
      const raw = localStorage.getItem(`hootka_questions_${quizId}`);
      if (raw) return JSON.parse(raw);
      if (quizId === 'demo-quiz-001') {
        const demoQuestions: Question[] = [
          { id: 'q1', quiz_id: quizId, text: 'Qual é a capital do Brasil?', option_a: 'São Paulo', option_b: 'Rio de Janeiro', option_c: 'Brasília', option_d: 'Salvador', correct_answer: 'C', time_seconds: 20, base_points: 100, is_special: 0, is_wildcard: 0, order_index: 0 },
          { id: 'q2', quiz_id: quizId, text: 'Em que ano o Brasil foi descoberto pelos portugueses?', option_a: '1400', option_b: '1500', option_c: '1550', option_d: '1492', correct_answer: 'B', time_seconds: 30, base_points: 100, is_special: 0, is_wildcard: 0, order_index: 1 },
          { id: 'q3', quiz_id: quizId, text: 'Qual é o maior rio do Brasil em extensão?', option_a: 'Rio São Francisco', option_b: 'Rio Paraná', option_c: 'Rio Tocantins', option_d: 'Rio Amazonas', correct_answer: 'D', time_seconds: 25, base_points: 100, is_special: 0, is_wildcard: 0, order_index: 2 },
          { id: 'q4', quiz_id: quizId, text: 'Qual é a maior floresta tropical do mundo?', option_a: 'Floresta do Congo', option_b: 'Floresta Amazônica', option_c: 'Mata Atlântica', option_d: 'Cerrado', correct_answer: 'B', time_seconds: 20, base_points: 100, is_special: 0, is_wildcard: 0, order_index: 3 },
          { id: 'q5', quiz_id: quizId, text: 'Quem proclamou a Independência do Brasil em 1822?', option_a: 'Dom Pedro I', option_b: 'Dom João VI', option_c: 'Tiradentes', option_d: 'Deodoro da Fonseca', correct_answer: 'A', time_seconds: 25, base_points: 150, is_special: 1, is_wildcard: 0, order_index: 4 },
          { id: 'q6', quiz_id: quizId, text: 'Quantas Copas do Mundo a Seleção Brasileira masculina venceu?', option_a: '3', option_b: '4', option_c: '5', option_d: '6', correct_answer: 'C', time_seconds: 20, base_points: 100, is_special: 0, is_wildcard: 0, order_index: 5 },
          { id: 'q7', quiz_id: quizId, text: 'Qual é o idioma oficial do Brasil?', option_a: 'Espanhol', option_b: 'Inglês', option_c: 'Latim', option_d: 'Português', correct_answer: 'D', time_seconds: 15, base_points: 100, is_special: 0, is_wildcard: 0, order_index: 6 },
          { id: 'q8', quiz_id: quizId, text: 'Em qual alternativa o uso da crase está CORRETO?', option_a: 'Fui a escola ontem.', option_b: 'Fui á escola ontem.', option_c: 'Fui à escola ontem.', option_d: 'Fui à uma escola ontem.', correct_answer: 'C', time_seconds: 30, base_points: 100, is_special: 0, is_wildcard: 0, order_index: 7 },
          { id: 'q9', quiz_id: quizId, text: 'Qual é o ritmo musical tradicional do carnaval carioca?', option_a: 'Forró', option_b: 'Axé', option_c: 'Funk', option_d: 'Samba', correct_answer: 'D', time_seconds: 20, base_points: 100, is_special: 0, is_wildcard: 0, order_index: 8 },
          { id: 'q10', quiz_id: quizId, text: '⚡ QUESTÃO DE VIRADA: Qual é a montanha mais alta do Brasil?', option_a: 'Pico da Bandeira', option_b: 'Pico da Neblina', option_c: 'Monte Roraima', option_d: 'Pico das Agulhas Negras', correct_answer: 'B', time_seconds: 40, base_points: 300, is_special: 1, is_wildcard: 1, order_index: 9 },
        ];
        localStorage.setItem(`hootka_questions_${quizId}`, JSON.stringify(demoQuestions));
        return demoQuestions;
      }
      return [];
    },
    create: async (data: Partial<Question>): Promise<{ id: string }> => {
      if (isElectron) return window.hootka.question.create(data);
      const quizId = data.quiz_id || '';
      const qs = await api.question.getByQuiz(quizId);
      const id = 'q-' + Date.now();
      const newQ: Question = {
        id,
        quiz_id: quizId,
        text: data.text || '',
        option_a: data.option_a || '',
        option_b: data.option_b || '',
        option_c: data.option_c || '',
        option_d: data.option_d || '',
        correct_answer: data.correct_answer || 'A',
        time_seconds: data.time_seconds || 30,
        base_points: data.base_points || 100,
        is_special: data.is_special ? 1 : 0,
        is_wildcard: data.is_wildcard ? 1 : 0,
        order_index: qs.length,
      };
      qs.push(newQ);
      localStorage.setItem(`hootka_questions_${quizId}`, JSON.stringify(qs));
      return { id };
    },
    update: async (id: string, data: Partial<Question>): Promise<{ success: boolean }> => {
      if (isElectron) return window.hootka.question.update(id, data);
      return { success: true };
    },
    delete: async (id: string): Promise<{ success: boolean }> => {
      if (isElectron) return window.hootka.question.delete(id);
      return { success: true };
    },
    reorder: async (quizId: string, ids: string[]): Promise<{ success: boolean }> => {
      if (isElectron) return window.hootka.question.reorder(quizId, ids);
      return { success: true };
    },
    importBatch: async (quizId: string, questions: any[]): Promise<{ count: number }> => {
      if (isElectron) return window.hootka.question.importBatch(quizId, questions);
      const qs = await api.question.getByQuiz(quizId);
      const mapped = questions.map((q, i) => ({
        ...q,
        id: 'q-' + Date.now() + '-' + i,
        quiz_id: quizId,
        order_index: qs.length + i,
      }));
      qs.push(...mapped);
      localStorage.setItem(`hootka_questions_${quizId}`, JSON.stringify(qs));
      return { count: questions.length };
    },
  },

  game: {
    create: async (data: any): Promise<{ id: string }> => {
      if (isElectron) return window.hootka.game.create(data);
      const id = 'game-' + Date.now();
      const game: Game = {
        id,
        quiz_id: data.quiz_id,
        quiz_name: data.quiz_name,
        mode: data.mode || 'classic',
        state: 'lobby',
        current_question_index: 0,
        settings: data.settings || {},
        teams: data.teams || [],
        questions: [],
      };
      const questions = await api.question.getByQuiz(data.quiz_id);
      game.questions = questions.map((q, i) => ({
        id: 'gq-' + i,
        question_id: q.id,
        question_text: q.text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        time_seconds: q.time_seconds,
        base_points: q.base_points,
        is_special: q.is_special,
        is_wildcard: q.is_wildcard,
        order_index: i,
      }));
      const games = JSON.parse(localStorage.getItem(MOCK_GAMES_KEY) || '[]');
      games.unshift(game);
      localStorage.setItem(MOCK_GAMES_KEY, JSON.stringify(games));
      return { id };
    },
    getById: async (id: string): Promise<any> => {
      if (isElectron) return window.hootka.game.getById(id);
      const games: Game[] = JSON.parse(localStorage.getItem(MOCK_GAMES_KEY) || '[]');
      return games.find((g) => g.id === id) || null;
    },
    getAll: async (): Promise<any[]> => {
      if (isElectron) return window.hootka.game.getAll();
      return JSON.parse(localStorage.getItem(MOCK_GAMES_KEY) || '[]');
    },
    getActive: async (): Promise<any> => {
      if (isElectron) return window.hootka.game.getActive();
      const games: Game[] = JSON.parse(localStorage.getItem(MOCK_GAMES_KEY) || '[]');
      return games.find((g) => g.state !== 'finished') || null;
    },
    updateState: async (id: string, state: string, extra?: any): Promise<{ success: boolean }> => {
      if (isElectron) return window.hootka.game.updateState(id, state, extra);
      const games: Game[] = JSON.parse(localStorage.getItem(MOCK_GAMES_KEY) || '[]');
      const idx = games.findIndex((g) => g.id === id);
      if (idx !== -1) {
        games[idx] = { ...games[idx], state: state as any, ...extra };
        localStorage.setItem(MOCK_GAMES_KEY, JSON.stringify(games));
      }
      return { success: true };
    },
    finish: async (id: string, data?: any): Promise<{ success: boolean }> => {
      if (isElectron) return window.hootka.game.finish(id, data || {});
      const games: Game[] = JSON.parse(localStorage.getItem(MOCK_GAMES_KEY) || '[]');
      const idx = games.findIndex((g) => g.id === id);
      if (idx !== -1) {
        games[idx] = { ...games[idx], state: 'finished', finished_at: new Date().toISOString() };
        localStorage.setItem(MOCK_GAMES_KEY, JSON.stringify(games));
      }
      return { success: true };
    },
    getStats: async (id: string): Promise<any> => {
      if (isElectron) return window.hootka.game.getStats(id);
      return {
        teamStats: [],
        questionStats: [],
        totalCorrect: 0,
        totalAnswers: 0,
        accuracy: '75.0',
      };
    },
  },

  team: {
    create: async (data: any): Promise<{ id: string }> => {
      if (isElectron) return window.hootka.team.create(data);
      return { id: 'team-' + Date.now() };
    },
    getByGame: async (gameId: string): Promise<Team[]> => {
      if (isElectron) return window.hootka.team.getByGame(gameId);
      const game = await api.game.getById(gameId);
      return game?.teams || [];
    },
    update: async (id: string, data: any): Promise<{ success: boolean }> => {
      if (isElectron) return window.hootka.team.update(id, data);
      return { success: true };
    },
    delete: async (id: string): Promise<{ success: boolean }> => {
      if (isElectron) return window.hootka.team.delete(id);
      return { success: true };
    },
  },

  answer: {
    saveAnswers: async (answers: Answer[]): Promise<{ success: boolean }> => {
      if (isElectron) return window.hootka.answer.saveAnswers(answers);
      return { success: true };
    },
    getByGame: async (gameId: string): Promise<Answer[]> => {
      if (isElectron) return window.hootka.answer.getByGame(gameId);
      return [];
    },
    getByQuestion: async (gameId: string, questionId: string): Promise<Answer[]> => {
      if (isElectron) return window.hootka.answer.getByQuestion(gameId, questionId);
      return [];
    },
  },

  import: {
    selectFile: async (): Promise<{ filePath: string; ext: string; content: string | null } | null> => {
      if (isElectron) return window.hootka.import.selectFile();
      return null;
    },
    parseCSV: async (content: string): Promise<any> => {
      if (isElectron) return window.hootka.import.parseCSV(content);
      return { content };
    },
    parseXLSX: async (filePath: string): Promise<any> => {
      if (isElectron) return window.hootka.import.parseXLSX(filePath);
      return { error: 'Not supported in browser mock' };
    },
  },

  backup: {
    export: async (options: any): Promise<{ success?: boolean; filePath?: string; canceled?: boolean }> => {
      if (isElectron) return window.hootka.backup.export(options);
      const quizzes = await api.quiz.getAll();
      const payload = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        quizzes,
        games: options?.includeHistory ? await api.game.getAll() : [],
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hootka_backup_${Date.now()}.hootka`;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true, filePath: 'download' };
    },
    import: async (): Promise<{ success?: boolean; quizCount?: number; error?: string; canceled?: boolean }> => {
      if (isElectron) return window.hootka.backup.import();
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.hootka,.json';
        input.onchange = async (e: any) => {
          const file = e.target?.files?.[0];
          if (!file) return resolve({ canceled: true });
          const text = await file.text();
          try {
            const data = JSON.parse(text);
            if (data.quizzes && Array.isArray(data.quizzes)) {
              const current = await api.quiz.getAll();
              const merged = [...data.quizzes, ...current.filter((c) => !data.quizzes.some((d: any) => d.id === c.id))];
              localStorage.setItem(MOCK_QUIZZES_KEY, JSON.stringify(merged));
              return resolve({ success: true, quizCount: data.quizzes.length });
            }
            resolve({ error: 'Arquivo inválido' });
          } catch (err: any) {
            resolve({ error: err.message });
          }
        };
        input.click();
      });
    },
  },

  settings: {
    get: async (key: string): Promise<string | null> => {
      if (isElectron) return window.hootka.settings.get(key);
      const settings = JSON.parse(localStorage.getItem(MOCK_SETTINGS_KEY) || '{}');
      return settings[key] ?? null;
    },
    set: async (key: string, value: any): Promise<{ success: boolean }> => {
      if (isElectron) return window.hootka.settings.set(key, value);
      const settings = JSON.parse(localStorage.getItem(MOCK_SETTINGS_KEY) || '{}');
      settings[key] = String(value);
      localStorage.setItem(MOCK_SETTINGS_KEY, JSON.stringify(settings));
      return { success: true };
    },
    getAll: async (): Promise<Record<string, string>> => {
      if (isElectron) return window.hootka.settings.getAll();
      return JSON.parse(localStorage.getItem(MOCK_SETTINGS_KEY) || '{"soundEnabled":"true","animationsEnabled":"true"}');
    },
  },

  window: {
    toggleFullscreen: async (): Promise<boolean> => {
      if (isElectron) return window.hootka.window.toggleFullscreen();
      return false;
    },
    isFullscreen: async (): Promise<boolean> => {
      if (isElectron) return window.hootka.window.isFullscreen();
      return false;
    },
  },
};

// Aliases for submodules
export const quizApi = api.quiz;
export const questionApi = api.question;
export const gameApi = api.game;
export const teamApi = api.team;
export const answerApi = api.answer;
export const importApi = api.import;
export const backupApi = api.backup;
export const settingsApi = api.settings;

export default api;
