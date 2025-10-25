import { app } from 'electron'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

import { runMigrations } from './migrations'

let dbInstance: Database.Database | null = null

const REQUESTS_TABLE_DDL = `
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    is_issued INTEGER DEFAULT 0,
    issued_at TEXT,
    notes TEXT
  )
`

const EQUIPMENT_ITEMS_TABLE_DDL = `
  CREATE TABLE IF NOT EXISTS equipment_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    equipment_name TEXT NOT NULL,
    serial_number TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
  )
`

const EMPLOYEE_EXITS_TABLE_DDL = `
  CREATE TABLE IF NOT EXISTS employee_exits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_name TEXT NOT NULL,
    login TEXT NOT NULL,
    exit_date TEXT NOT NULL,
    equipment_list TEXT NOT NULL,
    created_at TEXT NOT NULL,
    is_completed INTEGER DEFAULT 0
  )
`

const EQUIPMENT_ITEMS_INDEX_SQL =
  'CREATE INDEX IF NOT EXISTS idx_equipment_items_request ON equipment_items(request_id)'
const REQUESTS_CREATED_AT_INDEX_SQL =
  'CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at)'
const EMPLOYEE_EXIT_DATE_INDEX_SQL =
  'CREATE INDEX IF NOT EXISTS idx_employee_exits_exit_date ON employee_exits(exit_date)'

function getDatabasePath(): string {
  return path.join(app.getPath('userData'), 'equipment.db')
}

function configureDatabaseConnection(database: Database.Database) {
  try {
    database.pragma('foreign_keys = ON')
  } catch (error) {
    console.error('Не удалось включить foreign_keys:', error)
  }
}

function ensureSchema(database: Database.Database) {
  database.exec(REQUESTS_TABLE_DDL)
  database.exec(EQUIPMENT_ITEMS_TABLE_DDL)
  database.exec(EQUIPMENT_ITEMS_INDEX_SQL)
  database.exec(REQUESTS_CREATED_AT_INDEX_SQL)
  database.exec(EMPLOYEE_EXITS_TABLE_DDL)
  database.exec(EMPLOYEE_EXIT_DATE_INDEX_SQL)

  runMigrations(database)

  console.log('✅ База данных инициализирована')
}

export function initDatabase(): Database.Database {
  if (dbInstance) {
    return dbInstance
  }

  const database = new Database(getDatabasePath())
  configureDatabaseConnection(database)
  ensureSchema(database)
  dbInstance = database
  return database
}

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    throw new Error('База данных не инициализирована')
  }

  return dbInstance
}

export function reopenDatabase() {
  const database = new Database(getDatabasePath())
  configureDatabaseConnection(database)
  ensureSchema(database)

  if (dbInstance) {
    dbInstance.close()
  }

  dbInstance = database
}

export function closeDatabase() {
  if (!dbInstance) {
    return
  }

  dbInstance.close()
  dbInstance = null
}

export function getBackupsDirectory(): string {
  return path.join(app.getPath('userData'), 'backups')
}

export function ensureBackupsDirectory(): string {
  const backupsDir = getBackupsDirectory()
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true })
  }
  return backupsDir
}

export { getDatabasePath }
