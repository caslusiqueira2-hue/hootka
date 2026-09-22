import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'

let rawDb: SqlJsDatabase | null = null
let dbFilePath: string = ''

function saveToDisk() {
  if (!rawDb || !dbFilePath) return
  try {
    const data = rawDb.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbFilePath, buffer)
  } catch (err) {
    console.error('Failed to save database to disk:', err)
  }
}

export interface StatementWrapper {
  all(...params: any[]): any[]
  get(...params: any[]): any
  run(...params: any[]): { changes: number; lastInsertRowid: number }
}

export interface DatabaseWrapper {
  prepare(sql: string): StatementWrapper
  exec(sql: string): void
  transaction<T extends (...args: any[]) => any>(fn: T): T
  pragma(sql: string): void
}

const dbWrapper: DatabaseWrapper = {
  pragma(_sql: string) {
    // pragma no-op for wasm sqlite
  },
  exec(sql: string) {
    if (!rawDb) throw new Error('DB not initialized')
    rawDb.exec(sql)
    saveToDisk()
  },
  transaction<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: any[]) => {
      if (!rawDb) throw new Error('DB not initialized')
      rawDb.exec('BEGIN TRANSACTION')
      try {
        const result = fn(...args)
        rawDb.exec('COMMIT')
        saveToDisk()
        return result
      } catch (e) {
        rawDb.exec('ROLLBACK')
        throw e
      }
    }) as T
  },
  prepare(sql: string): StatementWrapper {
    if (!rawDb) throw new Error('DB not initialized')
    return {
      all(...params: any[]): any[] {
        if (!rawDb) return []
        const stmt = rawDb.prepare(sql)
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params
        if (flatParams.length > 0) {
          stmt.bind(flatParams)
        }
        const results: any[] = []
        while (stmt.step()) {
          results.push(stmt.getAsObject())
        }
        stmt.free()
        return results
      },
      get(...params: any[]): any {
        if (!rawDb) return null
        const stmt = rawDb.prepare(sql)
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params
        if (flatParams.length > 0) {
          stmt.bind(flatParams)
        }
        let result = null
        if (stmt.step()) {
          result = stmt.getAsObject()
        }
        stmt.free()
        return result
      },
      run(...params: any[]): { changes: number; lastInsertRowid: number } {
        if (!rawDb) return { changes: 0, lastInsertRowid: 0 }
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params
        rawDb.run(sql, flatParams)
        saveToDisk()
        return { changes: 1, lastInsertRowid: 0 }
      },
    }
  },
}

export function getDatabase(): DatabaseWrapper {
  if (!rawDb) throw new Error('Database not initialized')
  return dbWrapper
}

export async function initDatabase() {
  const userDataPath = app ? app.getPath('userData') : process.cwd()
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
  }
  const appRoot = app ? app.getAppPath() : process.cwd()
  const wasmCandidate = path.join(appRoot, 'node_modules/sql.js/dist/sql-wasm.wasm')
  const SQL = await initSqlJs({
    locateFile: () => (fs.existsSync(wasmCandidate) ? wasmCandidate : path.join(__dirname, '../node_modules/sql.js/dist/sql-wasm.wasm'))
  })

  if (fs.existsSync(dbFilePath)) {
    const fileBuffer = fs.readFileSync(dbFilePath)
    rawDb = new SQL.Database(fileBuffer)
  } else {
    rawDb = new SQL.Database()
  }

  createTables()
  seedDemoData()
  saveToDisk()
}

function createTables() {
  const d = getDatabase()

  d.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      subject TEXT DEFAULT '',
      grade TEXT DEFAULT '',
      theme TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT,
      text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      time_seconds INTEGER DEFAULT 30,
      base_points INTEGER DEFAULT 100,
      is_special INTEGER DEFAULT 0,
      is_wildcard INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      quiz_id TEXT,
      quiz_name TEXT,
      mode TEXT DEFAULT 'classic',
      state TEXT DEFAULT 'lobby',
      current_question_index INTEGER DEFAULT 0,
      settings TEXT DEFAULT '{}',
      started_at TEXT,
      finished_at TEXT,
      duration_seconds INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      game_id TEXT,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '🎯',
      color TEXT NOT NULL DEFAULT '#FF3B00',
      identifier TEXT DEFAULT '',
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS game_questions (
      id TEXT PRIMARY KEY,
      game_id TEXT,
      question_id TEXT,
      question_text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      time_seconds INTEGER DEFAULT 30,
      base_points INTEGER DEFAULT 100,
      is_special INTEGER DEFAULT 0,
      is_wildcard INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS answers (
      id TEXT PRIMARY KEY,
      game_id TEXT,
      game_question_id TEXT,
      team_id TEXT,
      correct INTEGER DEFAULT 0,
      elapsed_time REAL DEFAULT 0,
      base_score INTEGER DEFAULT 0,
      speed_bonus INTEGER DEFAULT 0,
      recovery_bonus INTEGER DEFAULT 0,
      streak_bonus INTEGER DEFAULT 0,
      special_bonus INTEGER DEFAULT 0,
      total_score INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS score_events (
      id TEXT PRIMARY KEY,
      game_id TEXT,
      team_id TEXT,
      event_type TEXT NOT NULL,
      data TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );
  `)
}

function seedDemoData() {
  const d = getDatabase()

  const existing = d.prepare('SELECT id FROM quizzes WHERE id = ?').get('demo-quiz-001')
  if (existing) return

  const demoQuizId = 'demo-quiz-001'

  d.prepare(`
    INSERT INTO quizzes (id, name, description, subject, grade, theme)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    demoQuizId,
    'Cultura Geral Brasileira',
    'Quiz demonstrativo com 10 questões sobre cultura geral do Brasil',
    'Cultura Geral',
    '9º Ano',
    'Brasil'
  )

  const questions = [
    {
      id: 'demo-q-001',
      text: 'Qual é a capital do Brasil?',
      a: 'São Paulo',
      b: 'Rio de Janeiro',
      c: 'Brasília',
      d: 'Salvador',
      correct: 'C',
      time: 20,
      points: 100,
      special: 0,
      wildcard: 0,
    },
    {
      id: 'demo-q-002',
      text: 'Em que ano o Brasil foi descoberto pelos portugueses?',
      a: '1400',
      b: '1500',
      c: '1550',
      d: '1492',
      correct: 'B',
      time: 30,
      points: 100,
      special: 0,
      wildcard: 0,
    },
    {
      id: 'demo-q-003',
      text: 'Qual é o maior rio do Brasil em extensão?',
      a: 'Rio São Francisco',
      b: 'Rio Paraná',
      c: 'Rio Tocantins',
      d: 'Rio Amazonas',
      correct: 'D',
      time: 25,
      points: 100,
      special: 0,
      wildcard: 0,
    },
    {
      id: 'demo-q-004',
      text: 'Qual é a maior floresta tropical do mundo, que está em grande parte no Brasil?',
      a: 'Floresta do Congo',
      b: 'Floresta Amazônica',
      c: 'Mata Atlântica',
      d: 'Cerrado',
      correct: 'B',
      time: 20,
      points: 100,
      special: 0,
      wildcard: 0,
    },
    {
      id: 'demo-q-005',
      text: 'Quem proclamou a Independência do Brasil em 1822?',
      a: 'Dom Pedro I',
      b: 'Dom João VI',
      c: 'Tiradentes',
      d: 'Deodoro da Fonseca',
      correct: 'A',
      time: 25,
      points: 150,
      special: 1,
      wildcard: 0,
    },
    {
      id: 'demo-q-006',
      text: 'Quantas Copas do Mundo a Seleção Brasileira masculina de futebol já venceu?',
      a: '3',
      b: '4',
      c: '5',
      d: '6',
      correct: 'C',
      time: 20,
      points: 100,
      special: 0,
      wildcard: 0,
    },
    {
      id: 'demo-q-007',
      text: 'Qual é o idioma oficial do Brasil?',
      a: 'Espanhol',
      b: 'Inglês',
      c: 'Latim',
      d: 'Português',
      correct: 'D',
      time: 15,
      points: 100,
      special: 0,
      wildcard: 0,
    },
    {
      id: 'demo-q-008',
      text: 'Em qual alternativa o uso da crase está CORRETO?',
      a: 'Fui a escola ontem.',
      b: 'Fui á escola ontem.',
      c: 'Fui à escola ontem.',
      d: 'Fui à uma escola ontem.',
      correct: 'C',
      time: 30,
      points: 100,
      special: 0,
      wildcard: 0,
    },
    {
      id: 'demo-q-009',
      text: 'Qual é a dança e gênero musical mais famoso do carnaval brasileiro?',
      a: 'Forró',
      b: 'Axé',
      c: 'Funk',
      d: 'Samba',
      correct: 'D',
      time: 20,
      points: 100,
      special: 0,
      wildcard: 0,
    },
    {
      id: 'demo-q-010',
      text: '⚡ QUESTÃO DE VIRADA: Qual é a montanha mais alta do Brasil?',
      a: 'Pico da Bandeira',
      b: 'Pico da Neblina',
      c: 'Monte Roraima',
      d: 'Pico das Agulhas Negras',
      correct: 'B',
      time: 45,
      points: 300,
      special: 1,
      wildcard: 1,
    },
  ]

  const stmt = d.prepare(`
    INSERT INTO questions (id, quiz_id, text, option_a, option_b, option_c, option_d, correct_answer, time_seconds, base_points, is_special, is_wildcard, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  questions.forEach((q, i) => {
    stmt.run(q.id, demoQuizId, q.text, q.a, q.b, q.c, q.d, q.correct, q.time, q.points, q.special, q.wildcard, i)
  })

  const defaultSettings = {
    soundEnabled: 'true',
    animationsEnabled: 'true',
    dynamicScoring: 'true',
    streakEnabled: 'true',
    recoveryBonusEnabled: 'true',
    showRankingAfterQuestion: 'true',
    specialQuestionsEnabled: 'true',
    defaultQuestionTime: '30',
  }

  const settingsStmt = d.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
  Object.entries(defaultSettings).forEach(([key, value]) => {
    settingsStmt.run(key, value)
  })
}
