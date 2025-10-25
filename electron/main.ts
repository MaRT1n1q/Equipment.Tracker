import { app, BrowserWindow, ipcMain, session, dialog } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'
import fs from 'fs'

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null
let db: Database.Database

// Путь к базе данных
const dbPath = path.join(app.getPath('userData'), 'equipment.db')

// Инициализация базы данных
function initDatabase() {
  db = new Database(dbPath)
  
  // Создание таблицы заявок
  db.exec(`
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_name TEXT NOT NULL,
      equipment_name TEXT NOT NULL,
      serial_number TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_issued INTEGER DEFAULT 0,
      issued_at TEXT,
      notes TEXT
    )
  `)
}

function createWindow() {
  // Определяем путь к preload скрипту
  const preloadPath = app.isPackaged
    ? path.join(__dirname, 'preload.js')
    : path.join(__dirname, '../electron/preload.js')

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
  })

  // Установить Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          app.isPackaged
            ? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;"
            : "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws: http://localhost:*;"
        ]
      }
    })
  })

  // В режиме разработки загружаем из dev сервера
  if (!app.isPackaged && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else if (!app.isPackaged) {
    // Fallback для dev режима если переменная не установлена
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    // В production загружаем собранные файлы
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC Handlers для работы с базой данных

// Получить все заявки
ipcMain.handle('get-requests', () => {
  try {
    const stmt = db.prepare('SELECT * FROM requests ORDER BY created_at DESC')
    return { success: true, data: stmt.all() }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// Создать новую заявку
ipcMain.handle('create-request', (_event: any, data: {
  employee_name: string
  equipment_name: string
  serial_number: string
  notes?: string
}) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO requests (employee_name, equipment_name, serial_number, created_at, notes)
      VALUES (?, ?, ?, ?, ?)
    `)
    const created_at = new Date().toISOString()
    const result = stmt.run(
      data.employee_name,
      data.equipment_name,
      data.serial_number,
      created_at,
      data.notes || null
    )
    return { success: true, id: result.lastInsertRowid }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// Обновить статус выдачи
ipcMain.handle('update-issued', (_event: any, id: number, is_issued: boolean) => {
  try {
    const issued_at = is_issued ? new Date().toISOString() : null
    const stmt = db.prepare('UPDATE requests SET is_issued = ?, issued_at = ? WHERE id = ?')
    stmt.run(is_issued ? 1 : 0, issued_at, id)
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// Обновить заявку
ipcMain.handle('update-request', (_event: any, id: number, data: {
  employee_name: string
  equipment_name: string
  serial_number: string
  notes?: string
}) => {
  try {
    const stmt = db.prepare(`
      UPDATE requests 
      SET employee_name = ?, equipment_name = ?, serial_number = ?, notes = ?
      WHERE id = ?
    `)
    stmt.run(data.employee_name, data.equipment_name, data.serial_number, data.notes || null, id)
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// Удалить заявку
ipcMain.handle('delete-request', (_event: any, id: number) => {
  try {
    // Сначала получаем данные для возможного восстановления
    const getStmt = db.prepare('SELECT * FROM requests WHERE id = ?')
    const deletedRequest = getStmt.get(id)
    
    const stmt = db.prepare('DELETE FROM requests WHERE id = ?')
    stmt.run(id)
    return { success: true, data: deletedRequest }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// Восстановить заявку
ipcMain.handle('restore-request', (_event: any, request: any) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO requests (id, employee_name, equipment_name, serial_number, created_at, is_issued, issued_at, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      request.id,
      request.employee_name,
      request.equipment_name,
      request.serial_number,
      request.created_at,
      request.is_issued,
      request.issued_at,
      request.notes
    )
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// Создать backup базы данных
ipcMain.handle('create-backup', async () => {
  try {
    const backupDir = path.join(app.getPath('userData'), 'backups')
    
    // Создать папку для backup если не существует
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
    const backupPath = path.join(backupDir, `equipment_backup_${timestamp}.db`)
    
    // Копировать файл базы данных
    fs.copyFileSync(dbPath, backupPath)
    
    return { success: true, path: backupPath }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// Восстановить из backup
ipcMain.handle('restore-backup', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Database Files', extensions: ['db'] }
      ]
    })
    
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Отменено пользователем' }
    }
    
    const backupFilePath = result.filePaths[0]
    
    // Закрыть текущее соединение
    db.close()
    
    // Создать копию текущей БД на всякий случай
    const emergencyBackup = dbPath + '.emergency'
    fs.copyFileSync(dbPath, emergencyBackup)
    
    try {
      // Восстановить из backup
      fs.copyFileSync(backupFilePath, dbPath)
      
      // Переоткрыть базу данных
      db = new Database(dbPath)
      
      // Удалить emergency backup
      fs.unlinkSync(emergencyBackup)
      
      return { success: true }
    } catch (error) {
      // При ошибке восстановить из emergency backup
      fs.copyFileSync(emergencyBackup, dbPath)
      fs.unlinkSync(emergencyBackup)
      db = new Database(dbPath)
      throw error
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

app.whenReady().then(() => {
  initDatabase()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Создать автоматический backup при закрытии
    try {
      const backupDir = path.join(app.getPath('userData'), 'backups')
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }
      
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
      const backupPath = path.join(backupDir, `auto_backup_${timestamp}.db`)
      
      fs.copyFileSync(dbPath, backupPath)
      
      // Удалить старые auto backups (оставить последние 5)
      const files = fs.readdirSync(backupDir)
        .filter(f => f.startsWith('auto_backup_'))
        .sort()
        .reverse()
      
      if (files.length > 5) {
        files.slice(5).forEach(f => {
          fs.unlinkSync(path.join(backupDir, f))
        })
      }
    } catch (error) {
      console.error('Auto backup failed:', error)
    }
    
    db.close()
    app.quit()
  }
})
