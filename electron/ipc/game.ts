import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { v4 as uuidv4 } from 'uuid'

export function registerGameHandlers() {
  const db = () => getDatabase()

  ipcMain.handle('game:create', (_, data: any) => {
    const gameId = uuidv4()
    db().prepare(`
      INSERT INTO games (id, quiz_id, quiz_name, mode, state, settings)
      VALUES (?, ?, ?, ?, 'lobby', ?)
    `).run(gameId, data.quiz_id, data.quiz_name, data.mode || 'classic', JSON.stringify(data.settings || {}))

    // Create teams
    if (data.teams && Array.isArray(data.teams)) {
      const teamStmt = db().prepare(`
        INSERT INTO teams (id, game_id, name, emoji, color, identifier, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      data.teams.forEach((t: any, i: number) => {
        teamStmt.run(t.id || uuidv4(), gameId, t.name, t.emoji, t.color, t.identifier || '', i)
      })
    }

    // Create game_questions from quiz questions
    const questions = db().prepare('SELECT * FROM questions WHERE quiz_id=? ORDER BY order_index').all(data.quiz_id) as any[]
    const gqStmt = db().prepare(`
      INSERT INTO game_questions (id, game_id, question_id, question_text, option_a, option_b, option_c, option_d, correct_answer, time_seconds, base_points, is_special, is_wildcard, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    questions.forEach((q, i) => {
      gqStmt.run(uuidv4(), gameId, q.id, q.text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.time_seconds, q.base_points, q.is_special, q.is_wildcard, i)
    })

    return { id: gameId }
  })

  ipcMain.handle('game:getById', (_, id: string) => {
    const game = db().prepare('SELECT * FROM games WHERE id=?').get(id) as any
    if (!game) return null
    game.settings = JSON.parse(game.settings || '{}')
    const teams = db().prepare('SELECT * FROM teams WHERE game_id=? ORDER BY order_index').all(id)
    const questions = db().prepare('SELECT * FROM game_questions WHERE game_id=? ORDER BY order_index').all(id)
    return { ...game, teams, questions }
  })

  ipcMain.handle('game:getAll', () => {
    const games = db().prepare(`
      SELECT g.*, COUNT(t.id) as team_count
      FROM games g
      LEFT JOIN teams t ON t.game_id = g.id
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `).all() as any[]
    return games.map(g => ({ ...g, settings: JSON.parse(g.settings || '{}') }))
  })

  ipcMain.handle('game:getActive', () => {
    const game = db().prepare("SELECT * FROM games WHERE state NOT IN ('finished') ORDER BY created_at DESC LIMIT 1").get() as any
    if (!game) return null
    return game
  })

  ipcMain.handle('game:updateState', (_, id: string, state: string, extra: any) => {
    if (extra && extra.current_question_index !== undefined) {
      db().prepare('UPDATE games SET state=?, current_question_index=? WHERE id=?').run(state, extra.current_question_index, id)
    } else {
      db().prepare('UPDATE games SET state=? WHERE id=?').run(state, id)
    }
    if (state === 'question' && extra?.started_at) {
      db().prepare("UPDATE games SET started_at=? WHERE id=? AND started_at IS NULL").run(extra.started_at, id)
    }
    return { success: true }
  })

  ipcMain.handle('game:finish', (_, id: string, data: any) => {
    db().prepare(`
      UPDATE games SET state='finished', finished_at=datetime('now'), duration_seconds=? WHERE id=?
    `).run(data.duration_seconds || 0, id)
    return { success: true }
  })

  ipcMain.handle('game:getStats', (_, id: string) => {
    const answers = db().prepare('SELECT * FROM answers WHERE game_id=?').all(id) as any[]
    const teams = db().prepare('SELECT * FROM teams WHERE game_id=?').all(id) as any[]
    const questions = db().prepare('SELECT * FROM game_questions WHERE game_id=? ORDER BY order_index').all(id) as any[]

    // Calculate stats per team
    const teamStats = teams.map((t: any) => {
      const teamAnswers = answers.filter(a => a.team_id === t.id)
      const correct = teamAnswers.filter(a => a.correct).length
      const totalScore = teamAnswers.reduce((sum, a) => sum + a.total_score, 0)
      const avgElapsed = teamAnswers.length > 0 ? teamAnswers.reduce((sum, a) => sum + a.elapsed_time, 0) / teamAnswers.length : 0
      return { ...t, correct, wrong: teamAnswers.length - correct, totalScore, avgElapsed }
    })

    // Stats per question
    const questionStats = questions.map((q: any) => {
      const qAnswers = answers.filter(a => a.game_question_id === q.id)
      const correct = qAnswers.filter(a => a.correct).length
      return { ...q, correct, wrong: qAnswers.length - correct, total: qAnswers.length }
    })

    const totalCorrect = answers.filter(a => a.correct).length
    const totalAnswers = answers.length
    const accuracy = totalAnswers > 0 ? (totalCorrect / totalAnswers * 100).toFixed(1) : '0'

    return { teamStats, questionStats, totalCorrect, totalAnswers, accuracy }
  })

  // Team handlers
  ipcMain.handle('team:create', (_, data: any) => {
    const id = uuidv4()
    db().prepare(`
      INSERT INTO teams (id, game_id, name, emoji, color, identifier, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.game_id, data.name, data.emoji, data.color, data.identifier || '', data.order_index || 0)
    return { id }
  })

  ipcMain.handle('team:getByGame', (_, gameId: string) => {
    return db().prepare('SELECT * FROM teams WHERE game_id=? ORDER BY order_index').all(gameId)
  })

  ipcMain.handle('team:update', (_, id: string, data: any) => {
    db().prepare('UPDATE teams SET name=?, emoji=?, color=?, identifier=? WHERE id=?')
      .run(data.name, data.emoji, data.color, data.identifier || '', id)
    return { success: true }
  })

  ipcMain.handle('team:delete', (_, id: string) => {
    db().prepare('DELETE FROM teams WHERE id=?').run(id)
    return { success: true }
  })

  // Answer handlers
  ipcMain.handle('answer:saveAnswers', (_, answers: any[]) => {
    const stmt = db().prepare(`
      INSERT OR REPLACE INTO answers (id, game_id, game_question_id, team_id, correct, elapsed_time, base_score, speed_bonus, recovery_bonus, streak_bonus, special_bonus, total_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const insertAll = db().transaction((ans: any[]) => {
      ans.forEach(a => {
        stmt.run(
          a.id || uuidv4(),
          a.game_id, a.game_question_id, a.team_id,
          a.correct ? 1 : 0,
          a.elapsed_time || 0,
          a.base_score || 0,
          a.speed_bonus || 0,
          a.recovery_bonus || 0,
          a.streak_bonus || 0,
          a.special_bonus || 0,
          a.total_score || 0
        )
      })
    })
    insertAll(answers)
    return { success: true }
  })

  ipcMain.handle('answer:getByGame', (_, gameId: string) => {
    return db().prepare('SELECT * FROM answers WHERE game_id=?').all(gameId)
  })

  ipcMain.handle('answer:getByQuestion', (_, gameId: string, questionId: string) => {
    return db().prepare('SELECT * FROM answers WHERE game_id=? AND game_question_id=?').all(gameId, questionId)
  })
}
