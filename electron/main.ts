import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { initDatabase, getDatabase } from './database'
import { registerQuizHandlers } from './ipc/quiz'
import { registerGameHandlers } from './ipc/game'
import { registerImportHandlers } from './ipc/import'
import { registerBackupHandlers } from './ipc/backup'
import { registerSettingsHandlers } from './ipc/settings'

const isDev = process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#F5F0E8',
    show: false,
    titleBarStyle: 'default',
    title: 'hootka',
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  // Init database first
  await initDatabase()

  // Register all IPC handlers
  registerQuizHandlers()
  registerGameHandlers()
  registerImportHandlers()
  registerBackupHandlers()
  registerSettingsHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Handle fullscreen toggle for game mode
ipcMain.handle('window:toggle-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen())
    return mainWindow.isFullScreen()
  }
  return false
})

ipcMain.handle('window:is-fullscreen', () => {
  return mainWindow?.isFullScreen() ?? false
})
