import type { Knex } from 'knex'

async function migrateLegacyRequests(database: Knex) {
  const hasRequestsTable = await database.schema.hasTable('requests')
  if (!hasRequestsTable) {
    return
  }

  const columnInfo = await database('requests').columnInfo()
  const hasOldColumns = Object.prototype.hasOwnProperty.call(columnInfo, 'equipment_name')

  if (!hasOldColumns) {
    return
  }

  console.log('▶️ Запуск миграции: разделение заявок и оборудования')

  const oldRequests = await database('requests').select('*')

  await database.transaction(async (trx) => {
    await trx.schema.createTable('requests_new', (table) => {
      table.increments('id').primary()
      table.string('employee_name').notNullable()
      table.string('login').notNullable().defaultTo('')
      table.string('created_at').notNullable()
      table.integer('is_issued').defaultTo(0)
      table.string('issued_at')
      table.text('notes')
    })

    const insertRequestRows = oldRequests.map((request) => ({
      id: request.id,
      employee_name: request.employee_name,
      login: request.login ?? '',
      created_at: request.created_at,
      is_issued: request.is_issued,
      issued_at: request.issued_at,
      notes: request.notes,
    }))

    if (insertRequestRows.length > 0) {
      await trx('requests_new').insert(insertRequestRows)
    }

    const equipmentRows = oldRequests
      .filter((request) => request.equipment_name && request.serial_number)
      .map((request) => ({
        request_id: request.id,
        equipment_name: request.equipment_name,
        serial_number: request.serial_number,
        quantity: 1,
      }))

    if (equipmentRows.length > 0) {
      await trx('equipment_items').insert(equipmentRows)
    }

    await trx.raw('DROP TABLE requests')
    await trx.raw('ALTER TABLE requests_new RENAME TO requests')
  })

  console.log('✅ Миграция базы данных завершена успешно')
}

export async function runMigrations(database: Knex) {
  await migrateLegacyRequests(database)
}
