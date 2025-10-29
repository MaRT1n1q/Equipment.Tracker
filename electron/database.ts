import { app } from 'electron'
import fs from 'fs'
import knex, { type Knex } from 'knex'
import path from 'path'

import { runMigrations } from './migrations'

let dbInstance: Knex | null = null

function getDatabasePath(): string {
  return path.join(app.getPath('userData'), 'equipment.db')
}

function createKnexInstance(): Knex {
  return knex({
    client: 'sqlite3',
    connection: {
      filename: getDatabasePath(),
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn: any, done: (err: Error | null, connection: any) => void) => {
        conn.run('PRAGMA foreign_keys = ON', (err: Error | null) => done(err, conn))
      },
    },
  })
}

async function ensureSchema(database: Knex) {
  const hasRequestsTable = await database.schema.hasTable('requests')
  if (!hasRequestsTable) {
    await database.schema.createTable('requests', (table) => {
      table.increments('id').primary()
      table.string('employee_name').notNullable()
      table.string('created_at').notNullable()
      table.integer('is_issued').defaultTo(0)
      table.string('issued_at')
      table.text('notes')
    })
  }

  const hasEquipmentItemsTable = await database.schema.hasTable('equipment_items')
  if (!hasEquipmentItemsTable) {
    await database.schema.createTable('equipment_items', (table) => {
      table.increments('id').primary()
      table
        .integer('request_id')
        .notNullable()
        .references('id')
        .inTable('requests')
        .onDelete('CASCADE')
      table.string('equipment_name').notNullable()
      table.string('serial_number').notNullable()
      table.integer('quantity').defaultTo(1)
    })
  }

  const hasEmployeeExitsTable = await database.schema.hasTable('employee_exits')
  if (!hasEmployeeExitsTable) {
    await database.schema.createTable('employee_exits', (table) => {
      table.increments('id').primary()
      table.string('employee_name').notNullable()
      table.string('login').notNullable()
      table.string('exit_date').notNullable()
      table.text('equipment_list').notNullable()
      table.string('created_at').notNullable()
      table.integer('is_completed').defaultTo(0)
    })
  }

  await database.raw(
    'CREATE INDEX IF NOT EXISTS idx_equipment_items_request ON equipment_items(request_id)'
  )
  await database.raw('CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at)')
  await database.raw(
    'CREATE INDEX IF NOT EXISTS idx_employee_exits_exit_date ON employee_exits(exit_date)'
  )

  await runMigrations(database)

  console.log('✅ База данных инициализирована')
}

export async function initDatabase(): Promise<Knex> {
  if (dbInstance) {
    return dbInstance
  }

  const database = createKnexInstance()
  await ensureSchema(database)
  dbInstance = database
  return database
}

export function getDatabase(): Knex {
  if (!dbInstance) {
    throw new Error('База данных не инициализирована')
  }

  return dbInstance
}

export async function reopenDatabase(): Promise<void> {
  const database = createKnexInstance()
  await ensureSchema(database)

  if (dbInstance) {
    await dbInstance.destroy()
  }

  dbInstance = database
}

export async function closeDatabase(): Promise<void> {
  if (!dbInstance) {
    return
  }

  await dbInstance.destroy()
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
