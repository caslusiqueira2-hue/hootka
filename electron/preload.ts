import { contextBridge, ipcRenderer } from 'electron'

// Expose safe API to renderer
contextBridge.exposeInMainWorld('hootka', {
  // Quiz
  quiz: {
    getAll: () => ipcRenderer.invoke('quiz:getAll'),
    getById: (id: string) => ipcRenderer.invoke('quiz:getById', id),
    create: (data: unknown) => ipcRenderer.invoke('quiz:create', data),
    update: (id: string, data: unknown) => ipcRenderer.invoke('quiz:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('quiz:delete', id),
    duplicate: (id: string) => ipcRenderer.invoke('quiz:duplicate', id),
    exportQuiz: (id: string) => ipcRenderer.invoke('quiz:export', id),
  },
  // Questions
  question: {
    getByQuiz: (quizId: string) => ipcRenderer.invoke('question:getByQuiz', quizId),
    create: (data: unknown) => ipcRenderer.invoke('question:create', data),
    update: (id: string, data: unknown) => ipcRenderer.invoke('question:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('question:delete', id),
    reorder: (quizId: string, ids: string[]) => ipcRenderer.invoke('question:reorder', quizId, ids),
    importBatch: (quizId: string, questions: unknown[]) => ipcRenderer.invoke('question:importBatch', quizId, questions),
  },
  // Game
  game: {
    create: (data: unknown) => ipcRenderer.invoke('game:create', data),
    getById: (id: string) => ipcRenderer.invoke('game:getById', id),
    getAll: () => ipcRenderer.invoke('game:getAll'),
    updateState: (id: string, state: string, extra?: unknown) => ipcRenderer.invoke('game:updateState', id, state, extra),
    getActive: () => ipcRenderer.invoke('game:getActive'),
    finish: (id: string, data: unknown) => ipcRenderer.invoke('game:finish', id, data),
    getStats: (id: string) => ipcRenderer.invoke('game:getStats', id),
  },
  // Teams
  team: {
    create: (data: unknown) => ipcRenderer.invoke('team:create', data),
    getByGame: (gameId: string) => ipcRenderer.invoke('team:getByGame', gameId),
    update: (id: string, data: unknown) => ipcRenderer.invoke('team:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('team:delete', id),
  },
  // Answers
  answer: {
    saveAnswers: (answers: unknown[]) => ipcRenderer.invoke('answer:saveAnswers', answers),
    getByGame: (gameId: string) => ipcRenderer.invoke('answer:getByGame', gameId),
    getByQuestion: (gameId: string, questionId: string) => ipcRenderer.invoke('answer:getByQuestion', gameId, questionId),
  },
  // Import
  import: {
    parseCSV: (content: string) => ipcRenderer.invoke('import:parseCSV', content),
    parseXLSX: (filePath: string) => ipcRenderer.invoke('import:parseXLSX', filePath),
    selectFile: () => ipcRenderer.invoke('import:selectFile'),
  },
  // Backup
  backup: {
    export: (options: unknown) => ipcRenderer.invoke('backup:export', options),
    import: () => ipcRenderer.invoke('backup:import'),
  },
  // Settings
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
  },
  // Window
  window: {
    toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
    isFullscreen: () => ipcRenderer.invoke('window:is-fullscreen'),
  },
})
