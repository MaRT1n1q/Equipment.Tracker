import type Database from 'better-sqlite3'

export interface Migration {
  version: number
  name: string
  up: (database: Database.Database) => void
}

function migrateLegacyRequests(database: Database.Database) {
  const tableInfo = database.pragma('table_info(requests)') as Array<{ name: string }>
  const hasOldColumns = tableInfo.some((column) => column.name === 'equipment_name')

  if (!hasOldColumns) {
    return
  }

  const oldRequests = database.prepare('SELECT * FROM requests').all() as Array<Record<string, any>>

  database.exec(`
    CREATE TABLE requests_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_issued INTEGER DEFAULT 0,
      issued_at TEXT,
      notes TEXT
    )
  `)

  const insertRequest = database.prepare(`
    INSERT INTO requests_new (id, employee_name, created_at, is_issued, issued_at, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const insertItem = database.prepare(`
    INSERT INTO equipment_items (request_id, equipment_name, serial_number, quantity)
    VALUES (?, ?, ?, 1)
  `)

  for (const request of oldRequests) {
    insertRequest.run(
      request.id,
      request.employee_name,
      request.created_at,
      request.is_issued,
      request.issued_at,
      request.notes
    )

    insertItem.run(request.id, request.equipment_name, request.serial_number)
  }

  database.exec('DROP TABLE requests')
  database.exec('ALTER TABLE requests_new RENAME TO requests')

  console.log('✅ Миграция базы данных завершена успешно')
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'Разделение заявок и оборудования по отдельным таблицам',
    up: migrateLegacyRequests,
  },
]

export function runMigrations(database: Database.Database) {
  if (migrations.length === 0) {
    return
  }

  const sortedMigrations = [...migrations].sort((a, b) => a.version - b.version)
  let currentVersion = Number(database.pragma('user_version', { simple: true })) || 0

  for (const migration of sortedMigrations) {
    if (migration.version <= currentVersion) {
      continue
    }

    console.log(`▶️ Запуск миграции v${migration.version}: ${migration.name}`)

    const applyMigration = database.transaction(() => {
      migration.up(database)
      database.pragma(`user_version = ${migration.version}`)
    })

    try {
      applyMigration()
    } catch (error) {
      console.error(`❌ Ошибка при выполнении миграции v${migration.version}:`, error)
      throw error
    }

    currentVersion = migration.version

    console.log(`✅ Миграция v${migration.version} завершена`)
  }
}
