// Type declarations for Electron preload bridge
interface HootkaAPI {
  quiz: {
    getAll: () => Promise<any[]>
    getById: (id: string) => Promise<any>
    create: (data: any) => Promise<{ id: string }>
    update: (id: string, data: any) => Promise<{ success: boolean }>
    delete: (id: string) => Promise<{ success: boolean }>
    duplicate: (id: string) => Promise<{ id: string }>
    exportQuiz: (id: string) => Promise<any>
  }
  question: {
    getByQuiz: (quizId: string) => Promise<any[]>
    create: (data: any) => Promise<{ id: string }>
    update: (id: string, data: any) => Promise<{ success: boolean }>
    delete: (id: string) => Promise<{ success: boolean }>
    reorder: (quizId: string, ids: string[]) => Promise<{ success: boolean }>
    importBatch: (quizId: string, questions: any[]) => Promise<{ count: number }>
  }
  game: {
    create: (data: any) => Promise<{ id: string }>
    getById: (id: string) => Promise<any>
    getAll: () => Promise<any[]>
    updateState: (id: string, state: string, extra?: any) => Promise<{ success: boolean }>
    getActive: () => Promise<any>
    finish: (id: string, data: any) => Promise<{ success: boolean }>
    getStats: (id: string) => Promise<any>
  }
  team: {
    create: (data: any) => Promise<{ id: string }>
    getByGame: (gameId: string) => Promise<any[]>
    update: (id: string, data: any) => Promise<{ success: boolean }>
    delete: (id: string) => Promise<{ success: boolean }>
  }
  answer: {
    saveAnswers: (answers: any[]) => Promise<{ success: boolean }>
    getByGame: (gameId: string) => Promise<any[]>
    getByQuestion: (gameId: string, questionId: string) => Promise<any[]>
  }
  import: {
    parseCSV: (content: string) => Promise<any>
    parseXLSX: (filePath: string) => Promise<any>
    selectFile: () => Promise<any>
  }
  backup: {
    export: (options: any) => Promise<any>
    import: () => Promise<any>
  }
  settings: {
    get: (key: string) => Promise<string | null>
    set: (key: string, value: any) => Promise<{ success: boolean }>
    getAll: () => Promise<Record<string, string>>
  }
  window: {
    toggleFullscreen: () => Promise<boolean>
    isFullscreen: () => Promise<boolean>
  }
}

declare global {
  interface Window {
    hootka: HootkaAPI
  }
}

export {}
