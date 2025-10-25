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
// Путь к файлу настроек окна
const windowStateFilePath = path.join(app.getPath('userData'), 'window-state.json')

// Интерфейс для состояния окна
interface WindowState {
  width: number
  height: number
  x?: number
  y?: number
  isMaximized?: boolean
}

// Загрузка состояния окна
function loadWindowState(): WindowState {
  try {
    if (fs.existsSync(windowStateFilePath)) {
      const data = fs.readFileSync(windowStateFilePath, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Ошибка при загрузке состояния окна:', error)
  }
  // Значения по умолчанию
  return { width: 1200, height: 800 }
}

// Сохранение состояния окна
function saveWindowState() {
  if (!mainWindow) return
  
  try {
    const bounds = mainWindow.getBounds()
    const windowState: WindowState = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: mainWindow.isMaximized()
    }
    fs.writeFileSync(windowStateFilePath, JSON.stringify(windowState, null, 2))
  } catch (error) {
    console.error('Ошибка при сохранении состояния окна:', error)
  }
}

// Инициализация базы данных
function initDatabase() {
  db = new Database(dbPath)
  
  // Создание таблицы заявок (основная информация)
  db.exec(`
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_issued INTEGER DEFAULT 0,
      issued_at TEXT,
      notes TEXT
    )
  `)

  // Создание таблицы позиций оборудования (связанных с заявкой)
  db.exec(`
    CREATE TABLE IF NOT EXISTS equipment_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL,
      equipment_name TEXT NOT NULL,
      serial_number TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
    )
  `)

  // Миграция данных из старой структуры (если есть старые записи)
  const tableInfo = db.pragma('table_info(requests)') as Array<{ name: string }>
  const hasOldColumns = tableInfo.some((col) => col.name === 'equipment_name')

  if (hasOldColumns) {
    try {
      // Получаем старые данные
      const oldRequests = db.prepare('SELECT * FROM requests').all() as any[]
      
      // Создаем временную таблицу с новой структурой
      db.exec(`
        CREATE TABLE requests_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_name TEXT NOT NULL,
          created_at TEXT NOT NULL,
          is_issued INTEGER DEFAULT 0,
          issued_at TEXT,
          notes TEXT
        )
      `)

      // Переносим данные в новую таблицу
      const insertRequest = db.prepare(`
        INSERT INTO requests_new (id, employee_name, created_at, is_issued, issued_at, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `)

      const insertItem = db.prepare(`
        INSERT INTO equipment_items (request_id, equipment_name, serial_number, quantity)
        VALUES (?, ?, ?, 1)
      `)

      db.transaction(() => {
        for (const req of oldRequests) {
          insertRequest.run(
            req.id,
            req.employee_name,
            req.created_at,
            req.is_issued,
            req.issued_at,
            req.notes
          )
          
          // Создаем запись оборудования из старых данных
          insertItem.run(
            req.id,
            req.equipment_name,
            req.serial_number
          )
        }
      })()

      // Удаляем старую таблицу и переименовываем новую
      db.exec('DROP TABLE requests')
      db.exec('ALTER TABLE requests_new RENAME TO requests')
      
      console.log('✅ Миграция базы данных завершена успешно')
    } catch (error) {
      console.error('❌ Ошибка при миграции базы данных:', error)
    }
  }

  // Создание таблицы выхода сотрудников
  db.exec(`
    CREATE TABLE IF NOT EXISTS employee_exits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_name TEXT NOT NULL,
      login TEXT NOT NULL,
      exit_date TEXT NOT NULL,
      equipment_list TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_completed INTEGER DEFAULT 0
    )
  `)

  console.log('✅ База данных инициализирована')
}

function createWindow() {
  // Загружаем сохраненное состояние окна
  const windowState = loadWindowState()
  
  // Определяем путь к preload скрипту
  const preloadPath = app.isPackaged
    ? path.join(__dirname, 'preload.js')
    : path.join(__dirname, '../electron/preload.js')

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
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

  // Восстанавливаем состояние максимизации
  if (windowState.isMaximized) {
    mainWindow.maximize()
  }

  // Сохраняем состояние окна при изменении размера или перемещении
  mainWindow.on('resize', () => {
    saveWindowState()
  })

  mainWindow.on('move', () => {
    saveWindowState()
  })

  // Сохраняем состояние при закрытии
  mainWindow.on('close', () => {
    saveWindowState()
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

// Получить все заявки с оборудованием
ipcMain.handle('get-requests', () => {
  try {
    const requests = db.prepare('SELECT * FROM requests ORDER BY created_at DESC').all() as any[]
    
    // Для каждой заявки получаем список оборудования
    const result = requests.map(request => {
      const equipment = db.prepare('SELECT * FROM equipment_items WHERE request_id = ?')
        .all(request.id) as any[]
      
      return {
        ...request,
        equipment_items: equipment
      }
    })
    
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// Создать новую заявку с несколькими позициями оборудования
ipcMain.handle('create-request', (_event: any, data: {
  employee_name: string
  notes?: string
  equipment_items: Array<{
    equipment_name: string
    serial_number: string
    quantity: number
  }>
}) => {
  try {
    const created_at = new Date().toISOString()
    
    const insertRequest = db.prepare(`
      INSERT INTO requests (employee_name, created_at, notes)
      VALUES (?, ?, ?)
    `)
    
    const insertEquipment = db.prepare(`
      INSERT INTO equipment_items (request_id, equipment_name, serial_number, quantity)
      VALUES (?, ?, ?, ?)
    `)
    
    // Используем транзакцию для атомарности операции
    const result = db.transaction(() => {
      const requestResult = insertRequest.run(
        data.employee_name,
        created_at,
        data.notes || null
      )
      
      const requestId = requestResult.lastInsertRowid
      
      // Добавляем все позиции оборудования
      for (const item of data.equipment_items) {
        insertEquipment.run(
          requestId,
          item.equipment_name,
          item.serial_number,
          item.quantity || 1
        )
      }
      
      return { id: requestId }
    })()
    
    return { success: true, id: result.id }
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

// Обновить заявку с оборудованием
ipcMain.handle('update-request', (_event: any, id: number, data: {
  employee_name: string
  notes?: string
  equipment_items: Array<{
    id?: number
    equipment_name: string
    serial_number: string
    quantity: number
  }>
}) => {
  try {
    const updateRequest = db.prepare(`
      UPDATE requests 
      SET employee_name = ?, notes = ?
      WHERE id = ?
    `)
    
    const deleteEquipment = db.prepare('DELETE FROM equipment_items WHERE request_id = ?')
    
    const insertEquipment = db.prepare(`
      INSERT INTO equipment_items (request_id, equipment_name, serial_number, quantity)
      VALUES (?, ?, ?, ?)
    `)
    
    // Используем транзакцию
    db.transaction(() => {
      updateRequest.run(data.employee_name, data.notes || null, id)
      
      // Удаляем старые позиции оборудования
      deleteEquipment.run(id)
      
      // Добавляем новые позиции
      for (const item of data.equipment_items) {
        insertEquipment.run(
          id,
          item.equipment_name,
          item.serial_number,
          item.quantity || 1
        )
      }
    })()
    
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// Удалить заявку с оборудованием
ipcMain.handle('delete-request', (_event: any, id: number) => {
  try {
    // Получаем данные для возможного восстановления
    const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(id) as any
    const equipment = db.prepare('SELECT * FROM equipment_items WHERE request_id = ?')
      .all(id) as any[]
    
    const deletedRequest = {
      ...request,
      equipment_items: equipment
    }
    
    // Удаляем заявку (equipment_items удалятся автоматически через CASCADE)
    const stmt = db.prepare('DELETE FROM requests WHERE id = ?')
    stmt.run(id)
    
    return { success: true, data: deletedRequest }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// Восстановить заявку с оборудованием
ipcMain.handle('restore-request', (_event: any, request: any) => {
  try {
    const insertRequest = db.prepare(`
      INSERT INTO requests (id, employee_name, created_at, is_issued, issued_at, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    
    const insertEquipment = db.prepare(`
      INSERT INTO equipment_items (request_id, equipment_name, serial_number, quantity)
      VALUES (?, ?, ?, ?)
    `)
    
    db.transaction(() => {
      insertRequest.run(
        request.id,
        request.employee_name,
        request.created_at,
        request.is_issued,
        request.issued_at,
        request.notes
      )
      
      // Восстанавливаем все позиции оборудования
      for (const item of request.equipment_items) {
        insertEquipment.run(
          request.id,
          item.equipment_name,
          item.serial_number,
          item.quantity
        )
      }
    })()
    
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// ==================== EMPLOYEE EXITS HANDLERS ====================

// Получить все записи выхода сотрудников
ipcMain.handle('get-employee-exits', async () => {
  try {
    const exits = db.prepare('SELECT * FROM employee_exits ORDER BY exit_date DESC').all()
    return { success: true, data: exits }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// Создать запись выхода сотрудника
ipcMain.handle('create-employee-exit', async (_event, data: {
  employee_name: string
  login: string
  exit_date: string
  equipment_list: string
}) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO employee_exits (employee_name, login, exit_date, equipment_list, created_at, is_completed)
      VALUES (?, ?, ?, ?, ?, 0)
    `)
    
    const result = stmt.run(
      data.employee_name,
      data.login,
      data.exit_date,
      data.equipment_list,
      new Date().toISOString()
    )
    
    return { success: true, id: result.lastInsertRowid }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// Обновить запись выхода сотрудника
ipcMain.handle('update-employee-exit', async (_event, id: number, data: {
  employee_name: string
  login: string
  exit_date: string
  equipment_list: string
}) => {
  try {
    const stmt = db.prepare(`
      UPDATE employee_exits
      SET employee_name = ?, login = ?, exit_date = ?, equipment_list = ?
      WHERE id = ?
    `)
    
    stmt.run(
      data.employee_name,
      data.login,
      data.exit_date,
      data.equipment_list,
      id
    )
    
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// Удалить запись выхода сотрудника
ipcMain.handle('delete-employee-exit', async (_event, id: number) => {
  try {
    // Получить запись перед удалением (для возможности восстановления)
    const exit = db.prepare('SELECT * FROM employee_exits WHERE id = ?').get(id)
    
    if (!exit) {
      return { success: false, error: 'Запись не найдена' }
    }
    
    // Удалить запись
    db.prepare('DELETE FROM employee_exits WHERE id = ?').run(id)
    
    return { success: true, data: exit }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// Обновить статус выполнения
ipcMain.handle('update-exit-completed', async (_event, id: number, is_completed: boolean) => {
  try {
    const stmt = db.prepare(`
      UPDATE employee_exits
      SET is_completed = ?
      WHERE id = ?
    `)
    
    stmt.run(is_completed ? 1 : 0, id)
    
    return { success: true }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
})

// ==================== BACKUP HANDLERS ====================

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
