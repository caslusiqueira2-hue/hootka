import { ipcMain, dialog } from 'electron'
import { getDatabase } from '../database'
import fs from 'fs'
import path from 'path'

export function registerBackupHandlers() {
  const db = () => getDatabase()

  ipcMain.handle('backup:export', async (_, options: any) => {
    const result = await dialog.showSaveDialog({
      title: 'Exportar backup hootka',
      defaultPath: `hootka-backup-${new Date().toISOString().split('T')[0]}.hootka`,
      filters: [{ name: 'hootka Backup', extensions: ['hootka'] }],
    })

    if (result.canceled || !result.filePath) return { canceled: true }

    const quizzes = db().prepare('SELECT * FROM quizzes').all()
    const questions = db().prepare('SELECT * FROM questions').all()
    const settings = db().prepare('SELECT * FROM settings').all()

    let backupData: any = { version: '1.0', quizzes, questions, settings }

    if (options?.includeHistory) {
      backupData.games = db().prepare('SELECT * FROM games').all()
      backupData.teams = db().prepare('SELECT * FROM teams').all()
      backupData.game_questions = db().prepare('SELECT * FROM game_questions').all()
      backupData.answers = db().prepare('SELECT * FROM answers').all()
    }

    fs.writeFileSync(result.filePath, JSON.stringify(backupData, null, 2), 'utf-8')
    return { success: true, filePath: result.filePath }
  })

  ipcMain.handle('backup:import', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Importar backup hootka',
      filters: [{ name: 'hootka Backup', extensions: ['hootka', 'json'] }],
      properties: ['openFile'],
    })

    if (result.canceled || result.filePaths.length === 0) return { canceled: true }

    try {
      const content = fs.readFileSync(result.filePaths[0], 'utf-8')
      const data = JSON.parse(content)

      const insertQuiz = db().prepare(`
        INSERT OR REPLACE INTO quizzes (id, name, description, subject, grade, theme, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      const insertQuestion = db().prepare(`
        INSERT OR REPLACE INTO questions (id, quiz_id, text, option_a, option_b, option_c, option_d, correct_answer, time_seconds, base_points, is_special, is_wildcard, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const importAll = db().transaction(() => {
        data.quizzes?.forEach((q: any) => {
          insertQuiz.run(q.id, q.name, q.description, q.subject, q.grade, q.theme, q.created_at, q.updated_at)
        })
        data.questions?.forEach((q: any) => {
          insertQuestion.run(q.id, q.quiz_id, q.text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.time_seconds, q.base_points, q.is_special, q.is_wildcard, q.order_index)
        })
      })

      importAll()
      return { success: true, quizCount: data.quizzes?.length || 0 }
    } catch (e: any) {
      return { error: e.message }
    }
  })
}
