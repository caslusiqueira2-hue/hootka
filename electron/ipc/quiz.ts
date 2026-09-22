import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import { v4 as uuidv4 } from 'uuid'

export function registerQuizHandlers() {
  const db = () => getDatabase()

  ipcMain.handle('quiz:getAll', () => {
    return db().prepare(`
      SELECT q.*, COUNT(qu.id) as question_count
      FROM quizzes q
      LEFT JOIN questions qu ON qu.quiz_id = q.id
      GROUP BY q.id
      ORDER BY q.updated_at DESC
    `).all()
  })

  ipcMain.handle('quiz:getById', (_, id: string) => {
    return db().prepare('SELECT * FROM quizzes WHERE id = ?').get(id)
  })

  ipcMain.handle('quiz:create', (_, data: any) => {
    const id = uuidv4()
    db().prepare(`
      INSERT INTO quizzes (id, name, description, subject, grade, theme)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.name, data.description || '', data.subject || '', data.grade || '', data.theme || '')
    return { id }
  })

  ipcMain.handle('quiz:update', (_, id: string, data: any) => {
    db().prepare(`
      UPDATE quizzes SET name=?, description=?, subject=?, grade=?, theme=?, updated_at=datetime('now')
      WHERE id=?
    `).run(data.name, data.description || '', data.subject || '', data.grade || '', data.theme || '', id)
    return { success: true }
  })

  ipcMain.handle('quiz:delete', (_, id: string) => {
    db().prepare('DELETE FROM quizzes WHERE id=?').run(id)
    return { success: true }
  })

  ipcMain.handle('quiz:duplicate', (_, id: string) => {
    const quiz = db().prepare('SELECT * FROM quizzes WHERE id=?').get(id) as any
    const questions = db().prepare('SELECT * FROM questions WHERE quiz_id=? ORDER BY order_index').all(id) as any[]

    if (!quiz) return { error: 'Quiz not found' }

    const newId = uuidv4()
    db().prepare(`
      INSERT INTO quizzes (id, name, description, subject, grade, theme)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(newId, `${quiz.name} (Cópia)`, quiz.description, quiz.subject, quiz.grade, quiz.theme)

    const qStmt = db().prepare(`
      INSERT INTO questions (id, quiz_id, text, option_a, option_b, option_c, option_d, correct_answer, time_seconds, base_points, is_special, is_wildcard, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    questions.forEach((q) => {
      qStmt.run(uuidv4(), newId, q.text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.time_seconds, q.base_points, q.is_special, q.is_wildcard, q.order_index)
    })

    return { id: newId }
  })

  ipcMain.handle('quiz:export', (_, id: string) => {
    const quiz = db().prepare('SELECT * FROM quizzes WHERE id=?').get(id)
    const questions = db().prepare('SELECT * FROM questions WHERE quiz_id=? ORDER BY order_index').all(id)
    return { quiz, questions }
  })

  // Question handlers
  ipcMain.handle('question:getByQuiz', (_, quizId: string) => {
    return db().prepare('SELECT * FROM questions WHERE quiz_id=? ORDER BY order_index').all(quizId)
  })

  ipcMain.handle('question:create', (_, data: any) => {
    const id = uuidv4()
    const maxOrder = (db().prepare('SELECT MAX(order_index) as max FROM questions WHERE quiz_id=?').get(data.quiz_id) as any)?.max ?? -1
    db().prepare(`
      INSERT INTO questions (id, quiz_id, text, option_a, option_b, option_c, option_d, correct_answer, time_seconds, base_points, is_special, is_wildcard, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.quiz_id, data.text, data.option_a, data.option_b, data.option_c, data.option_d, data.correct_answer, data.time_seconds || 30, data.base_points || 100, data.is_special ? 1 : 0, data.is_wildcard ? 1 : 0, maxOrder + 1)
    return { id }
  })

  ipcMain.handle('question:update', (_, id: string, data: any) => {
    db().prepare(`
      UPDATE questions SET text=?, option_a=?, option_b=?, option_c=?, option_d=?, correct_answer=?, time_seconds=?, base_points=?, is_special=?, is_wildcard=?
      WHERE id=?
    `).run(data.text, data.option_a, data.option_b, data.option_c, data.option_d, data.correct_answer, data.time_seconds, data.base_points, data.is_special ? 1 : 0, data.is_wildcard ? 1 : 0, id)
    return { success: true }
  })

  ipcMain.handle('question:delete', (_, id: string) => {
    db().prepare('DELETE FROM questions WHERE id=?').run(id)
    return { success: true }
  })

  ipcMain.handle('question:reorder', (_, quizId: string, ids: string[]) => {
    const stmt = db().prepare('UPDATE questions SET order_index=? WHERE id=? AND quiz_id=?')
    ids.forEach((id, i) => stmt.run(i, id, quizId))
    return { success: true }
  })

  ipcMain.handle('question:importBatch', (_, quizId: string, questions: any[]) => {
    const maxOrder = (db().prepare('SELECT MAX(order_index) as max FROM questions WHERE quiz_id=?').get(quizId) as any)?.max ?? -1
    const stmt = db().prepare(`
      INSERT INTO questions (id, quiz_id, text, option_a, option_b, option_c, option_d, correct_answer, time_seconds, base_points, is_special, is_wildcard, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const insertMany = db().transaction((qs: any[]) => {
      qs.forEach((q, i) => {
        stmt.run(uuidv4(), quizId, q.text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.time_seconds || 30, q.base_points || 100, q.is_special ? 1 : 0, 0, maxOrder + 1 + i)
      })
    })
    insertMany(questions)
    return { count: questions.length }
  })
}
