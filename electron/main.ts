import { app, BrowserWindow, ipcMain, session } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'

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
      issued_at TEXT
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
}) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO requests (employee_name, equipment_name, serial_number, created_at)
      VALUES (?, ?, ?, ?)
    `)
    const created_at = new Date().toISOString()
    const result = stmt.run(
      data.employee_name,
      data.equipment_name,
      data.serial_number,
      created_at
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
}) => {
  try {
    const stmt = db.prepare(`
      UPDATE requests 
      SET employee_name = ?, equipment_name = ?, serial_number = ?
      WHERE id = ?
    `)
    stmt.run(data.employee_name, data.equipment_name, data.serial_number, id)
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// Удалить заявку
ipcMain.handle('delete-request', (_event: any, id: number) => {
  try {
    const stmt = db.prepare('DELETE FROM requests WHERE id = ?')
    stmt.run(id)
    return { success: true }
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
    db.close()
    app.quit()
  }
})
