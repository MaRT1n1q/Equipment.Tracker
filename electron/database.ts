import { app } from 'electron'
import fs from 'fs'
import knex, { type Knex } from 'knex'
import path from 'path'

import { runMigrations } from './migrations'

interface MockRequestSeed {
  employeeName: string
  login: string
  sdNumber?: string
  notes?: string
  isIssued: boolean
  equipment: Array<{ name: string; serial: string; quantity: number }>
}

interface MockEmployeeExitSeed {
  employeeName: string
  login: string
  sdNumber?: string
  exitDate: string
  equipmentList: string
  isCompleted: boolean
}

const mockRequestSeeds: MockRequestSeed[] = []

const mockEmployeeExitSeeds: MockEmployeeExitSeed[] = []

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
      table.string('login').notNullable()
      table.string('sd_number')
      table.string('delivery_url')
      table.string('created_at').notNullable()
      table.integer('is_issued').defaultTo(0)
      table.string('issued_at')
      table.text('notes')
      table.integer('return_required').notNullable().defaultTo(0)
      table.string('return_due_date')
      table.text('return_equipment')
      table.integer('return_completed').notNullable().defaultTo(0)
      table.string('return_completed_at')
      table.string('return_scheduled_at')
    })
  } else {
    const hasLoginColumn = await database.schema.hasColumn('requests', 'login')
    if (!hasLoginColumn) {
      await database.schema.alterTable('requests', (table) => {
        table.string('login').defaultTo('').notNullable()
      })

      await database('requests').whereNull('login').update({ login: '' })
    }

    const hasSdNumberColumn = await database.schema.hasColumn('requests', 'sd_number')
    if (!hasSdNumberColumn) {
      await database.schema.alterTable('requests', (table) => {
        table.string('sd_number')
      })
    }

    const hasDeliveryUrlColumn = await database.schema.hasColumn('requests', 'delivery_url')
    if (!hasDeliveryUrlColumn) {
      await database.schema.alterTable('requests', (table) => {
        table.string('delivery_url')
      })
    }

    const hasReturnRequiredColumn = await database.schema.hasColumn('requests', 'return_required')
    if (!hasReturnRequiredColumn) {
      await database.schema.alterTable('requests', (table) => {
        table.integer('return_required').notNullable().defaultTo(0)
      })
      await database('requests').update({ return_required: 0 })
    }

    const hasReturnDueDateColumn = await database.schema.hasColumn('requests', 'return_due_date')
    if (!hasReturnDueDateColumn) {
      await database.schema.alterTable('requests', (table) => {
        table.string('return_due_date')
      })
    }

    const hasReturnEquipmentColumn = await database.schema.hasColumn('requests', 'return_equipment')
    if (!hasReturnEquipmentColumn) {
      await database.schema.alterTable('requests', (table) => {
        table.text('return_equipment')
      })
    }

    const hasReturnCompletedColumn = await database.schema.hasColumn('requests', 'return_completed')
    if (!hasReturnCompletedColumn) {
      await database.schema.alterTable('requests', (table) => {
        table.integer('return_completed').notNullable().defaultTo(0)
      })
      await database('requests').update({ return_completed: 0 })
    }

    const hasReturnCompletedAtColumn = await database.schema.hasColumn(
      'requests',
      'return_completed_at'
    )
    if (!hasReturnCompletedAtColumn) {
      await database.schema.alterTable('requests', (table) => {
        table.string('return_completed_at')
      })
    }

    const hasReturnScheduledAtColumn = await database.schema.hasColumn(
      'requests',
      'return_scheduled_at'
    )
    if (!hasReturnScheduledAtColumn) {
      await database.schema.alterTable('requests', (table) => {
        table.string('return_scheduled_at')
      })
    }
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
      table.string('sd_number')
      table.string('delivery_url')
      table.string('exit_date').notNullable()
      table.text('equipment_list').notNullable()
      table.string('created_at').notNullable()
      table.integer('is_completed').defaultTo(0)
    })
  } else {
    const hasSdNumberColumn = await database.schema.hasColumn('employee_exits', 'sd_number')
    if (!hasSdNumberColumn) {
      await database.schema.alterTable('employee_exits', (table) => {
        table.string('sd_number')
      })
    }

    const hasDeliveryUrlColumn = await database.schema.hasColumn('employee_exits', 'delivery_url')
    if (!hasDeliveryUrlColumn) {
      await database.schema.alterTable('employee_exits', (table) => {
        table.string('delivery_url')
      })
    }
  }

  const hasTemplatesTable = await database.schema.hasTable('templates')
  if (!hasTemplatesTable) {
    await database.schema.createTable('templates', (table) => {
      table.increments('id').primary()
      table.string('title').notNullable()
      table.text('content').notNullable()
      table.string('created_at').notNullable()
      table.string('updated_at').notNullable()
      table.integer('sort_order').notNullable().defaultTo(0)
    })
  }

  // Таблица файлов шаблонов
  const hasTemplateFilesTable = await database.schema.hasTable('template_files')
  if (!hasTemplateFilesTable) {
    await database.schema.createTable('template_files', (table) => {
      table.increments('id').primary()
      table
        .integer('template_id')
        .notNullable()
        .references('id')
        .inTable('templates')
        .onDelete('CASCADE')
      table.string('filename').notNullable() // Уникальное имя файла на диске
      table.string('original_name').notNullable() // Оригинальное имя файла
      table.integer('file_size').notNullable() // Размер в байтах
      table.string('mime_type').notNullable() // MIME тип файла
      table.string('created_at').notNullable()
    })
  }

  // Миграция для templates: добавление sort_order
  const hasSortOrderColumn = await database.schema.hasColumn('templates', 'sort_order')
  if (!hasSortOrderColumn) {
    await database.schema.alterTable('templates', (table) => {
      table.integer('sort_order').notNullable().defaultTo(0)
    })

    const existingTemplates = await database('templates').select('id').orderBy('created_at', 'asc')
    await Promise.all(
      existingTemplates.map((template, index) =>
        database('templates').where({ id: template.id }).update({ sort_order: index })
      )
    )
  }

  await database.raw(
    'CREATE INDEX IF NOT EXISTS idx_equipment_items_request ON equipment_items(request_id)'
  )
  await database.raw('CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at)')
  await database.raw(
    'CREATE INDEX IF NOT EXISTS idx_employee_exits_exit_date ON employee_exits(exit_date)'
  )
  await database.raw('CREATE INDEX IF NOT EXISTS idx_templates_title ON templates(title)')
  await database.raw('CREATE INDEX IF NOT EXISTS idx_templates_sort_order ON templates(sort_order)')
  await database.raw(
    'CREATE INDEX IF NOT EXISTS idx_template_files_template ON template_files(template_id)'
  )

  await runMigrations(database)

  await seedInitialData(database)

  console.log('✅ База данных инициализирована')
}

interface CountResult {
  count: number | string | bigint | null | undefined
}

function normalizeCount(value: number | string | bigint | null | undefined): number {
  if (value === null || value === undefined) {
    return 0
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'bigint') {
    return Number(value)
  }

  const numeric = Number(value)
  return Number.isNaN(numeric) ? 0 : numeric
}

function ensureNumericId(insertResult: unknown): number {
  const rawValue = Array.isArray(insertResult) ? insertResult[0] : insertResult
  const numeric = normalizeCount(rawValue as number | string | bigint | null | undefined)

  if (Number.isNaN(numeric) || numeric === 0) {
    throw new Error('Не удалось получить идентификатор при сидировании данных')
  }

  return numeric
}

async function seedRequests(database: Knex) {
  if (mockRequestSeeds.length === 0) {
    return
  }

  const now = Date.now()

  await database.transaction(async (trx) => {
    for (const [index, seed] of mockRequestSeeds.entries()) {
      const createdAt = new Date(now - index * 36 * 60 * 60 * 1000).toISOString()
      const issuedAt = seed.isIssued
        ? new Date(now - index * 36 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString()
        : null

      const insertResult = await trx('requests').insert({
        employee_name: seed.employeeName,
        login: seed.login,
        sd_number: seed.sdNumber ?? null,
        created_at: createdAt,
        is_issued: seed.isIssued ? 1 : 0,
        issued_at: issuedAt,
        notes: seed.notes ?? null,
      })

      const requestId = ensureNumericId(insertResult)

      if (seed.equipment.length > 0) {
        const equipmentRows = seed.equipment.map((item) => ({
          request_id: requestId,
          equipment_name: item.name,
          serial_number: item.serial,
          quantity: item.quantity,
        }))

        await trx('equipment_items').insert(equipmentRows)
      }
    }
  })
}

async function seedEmployeeExits(database: Knex) {
  if (mockEmployeeExitSeeds.length === 0) {
    return
  }

  const now = Date.now()

  const rows = mockEmployeeExitSeeds.map((seed, index) => ({
    employee_name: seed.employeeName,
    login: seed.login,
    sd_number: seed.sdNumber ?? null,
    exit_date: seed.exitDate,
    equipment_list: seed.equipmentList,
    created_at: new Date(now - index * 48 * 60 * 60 * 1000).toISOString(),
    is_completed: seed.isCompleted ? 1 : 0,
  }))

  await database('employee_exits').insert(rows)
}

async function seedInitialData(database: Knex) {
  const [{ count: requestsCountRaw }] = await database('requests').count<CountResult>({
    count: 'id',
  })
  const requestsCount = normalizeCount(requestsCountRaw)

  if (requestsCount === 0) {
    await seedRequests(database)
  }

  const [{ count: exitsCountRaw }] = await database('employee_exits').count<CountResult>({
    count: 'id',
  })
  const exitsCount = normalizeCount(exitsCountRaw)

  if (exitsCount === 0) {
    await seedEmployeeExits(database)
  }
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

export function getTemplateFilesDirectory(): string {
  return path.join(app.getPath('userData'), 'template_files')
}

export function ensureTemplateFilesDirectory(): string {
  const filesDir = getTemplateFilesDirectory()
  if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true })
  }
  return filesDir
}

export { getDatabasePath }
