import { ipcMain, dialog } from 'electron'
import path from 'path'
import fs from 'fs'

export function registerImportHandlers() {
  ipcMain.handle('import:selectFile', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Selecionar arquivo de questões',
      filters: [
        { name: 'Planilhas', extensions: ['csv', 'xlsx', 'xls'] },
        { name: 'CSV', extensions: ['csv'] },
        { name: 'Excel', extensions: ['xlsx', 'xls'] },
      ],
      properties: ['openFile'],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    const ext = path.extname(filePath).toLowerCase()
    const content = ext === '.csv' ? fs.readFileSync(filePath, 'utf-8') : null
    return { filePath, ext, content }
  })

  ipcMain.handle('import:parseCSV', (_, content: string) => {
    // Simple CSV parser (papaparse is in renderer)
    return { content }
  })

  ipcMain.handle('import:parseXLSX', (_, filePath: string) => {
    try {
      // XLSX is loaded in renderer via IPC
      const buffer = fs.readFileSync(filePath)
      return { buffer: buffer.toString('base64') }
    } catch (e: any) {
      return { error: e.message }
    }
  })
}
