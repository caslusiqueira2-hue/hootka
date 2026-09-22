import { ipcMain } from 'electron'
import { getDatabase } from '../database'

export function registerSettingsHandlers() {
  const db = () => getDatabase()

  ipcMain.handle('settings:get', (_, key: string) => {
    const row = db().prepare('SELECT value FROM settings WHERE key=?').get(key) as any
    return row?.value ?? null
  })

  ipcMain.handle('settings:set', (_, key: string, value: any) => {
    db().prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, String(value))
    return { success: true }
  })

  ipcMain.handle('settings:getAll', () => {
    const rows = db().prepare('SELECT * FROM settings').all() as any[]
    const result: Record<string, string> = {}
    rows.forEach(r => { result[r.key] = r.value })
    return result
  })
}
