import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import knex, { type Knex } from 'knex'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('Database Schema Tests', () => {
  let db: Knex
  let dbPath: string

  beforeEach(async () => {
    // Создаем временную базу данных для тестов
    dbPath = path.join(os.tmpdir(), `test-equipment-${Date.now()}.db`)

    db = knex({
      client: 'sqlite3',
      connection: {
        filename: dbPath,
      },
      useNullAsDefault: true,
      pool: {
        afterCreate: (conn: any, done: (err: Error | null, connection: any) => void) => {
          conn.run('PRAGMA foreign_keys = ON', (err: Error | null) => done(err, conn))
        },
      },
    })
  })

  afterEach(async () => {
    await db.destroy()
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath)
    }
  })

  describe('requests table', () => {
    it('должна создаться таблица requests', async () => {
      await db.schema.createTable('requests', (table) => {
        table.increments('id').primary()
        table.string('employee_name').notNullable()
        table.string('login').notNullable()
        table.string('sd_number')
        table.string('created_at').notNullable()
        table.integer('is_issued').defaultTo(0)
        table.string('issued_at')
        table.text('notes')
      })

      const exists = await db.schema.hasTable('requests')
      expect(exists).toBe(true)
    })

    it('должна иметь все необходимые колонки', async () => {
      await db.schema.createTable('requests', (table) => {
        table.increments('id').primary()
        table.string('employee_name').notNullable()
        table.string('login').notNullable()
        table.string('sd_number')
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

      const columns = [
        'id',
        'employee_name',
        'login',
        'sd_number',
        'created_at',
        'is_issued',
        'issued_at',
        'notes',
        'return_required',
        'return_due_date',
        'return_equipment',
        'return_completed',
        'return_completed_at',
        'return_scheduled_at',
      ]

      for (const column of columns) {
        const exists = await db.schema.hasColumn('requests', column)
        expect(exists).toBe(true)
      }
    })

    it('должна вставить и получить запись', async () => {
      await db.schema.createTable('requests', (table) => {
        table.increments('id').primary()
        table.string('employee_name').notNullable()
        table.string('login').notNullable()
        table.string('sd_number')
        table.string('created_at').notNullable()
        table.integer('is_issued').defaultTo(0)
        table.string('issued_at')
        table.text('notes')
      })

      const [id] = await db('requests').insert({
        employee_name: 'Иванов Иван',
        login: 'ivanov',
        sd_number: 'SD-12345',
        created_at: new Date().toISOString(),
        is_issued: 0,
      })

      const request = await db('requests').where({ id }).first()

      expect(request).toBeDefined()
      expect(request.employee_name).toBe('Иванов Иван')
      expect(request.login).toBe('ivanov')
      expect(request.sd_number).toBe('SD-12345')
    })

    it('должна обновить запись', async () => {
      await db.schema.createTable('requests', (table) => {
        table.increments('id').primary()
        table.string('employee_name').notNullable()
        table.string('login').notNullable()
        table.string('created_at').notNullable()
        table.integer('is_issued').defaultTo(0)
      })

      const [id] = await db('requests').insert({
        employee_name: 'Иванов Иван',
        login: 'ivanov',
        created_at: new Date().toISOString(),
        is_issued: 0,
      })

      await db('requests').where({ id }).update({ is_issued: 1 })

      const request = await db('requests').where({ id }).first()
      expect(request.is_issued).toBe(1)
    })

    it('должна удалить запись', async () => {
      await db.schema.createTable('requests', (table) => {
        table.increments('id').primary()
        table.string('employee_name').notNullable()
        table.string('login').notNullable()
        table.string('created_at').notNullable()
      })

      const [id] = await db('requests').insert({
        employee_name: 'Иванов Иван',
        login: 'ivanov',
        created_at: new Date().toISOString(),
      })

      await db('requests').where({ id }).delete()

      const request = await db('requests').where({ id }).first()
      expect(request).toBeUndefined()
    })
  })

  describe('equipment_items table', () => {
    beforeEach(async () => {
      // Создаем таблицу requests для внешнего ключа
      await db.schema.createTable('requests', (table) => {
        table.increments('id').primary()
        table.string('employee_name').notNullable()
        table.string('login').notNullable()
        table.string('created_at').notNullable()
      })
    })

    it('должна создаться таблица equipment_items', async () => {
      await db.schema.createTable('equipment_items', (table) => {
        table.increments('id').primary()
        table.integer('request_id').unsigned().notNullable()
        table.string('equipment_name').notNullable()
        table.string('serial_number').notNullable()
        table.integer('quantity').notNullable().defaultTo(1)
        table.foreign('request_id').references('requests.id').onDelete('CASCADE')
      })

      const exists = await db.schema.hasTable('equipment_items')
      expect(exists).toBe(true)
    })

    it('должна соблюдать внешний ключ', async () => {
      await db.schema.createTable('equipment_items', (table) => {
        table.increments('id').primary()
        table.integer('request_id').unsigned().notNullable()
        table.string('equipment_name').notNullable()
        table.string('serial_number').notNullable()
        table.integer('quantity').notNullable().defaultTo(1)
        table.foreign('request_id').references('requests.id').onDelete('CASCADE')
      })

      const [requestId] = await db('requests').insert({
        employee_name: 'Иванов Иван',
        login: 'ivanov',
        created_at: new Date().toISOString(),
      })

      const [itemId] = await db('equipment_items').insert({
        request_id: requestId,
        equipment_name: 'Ноутбук',
        serial_number: 'SN12345',
        quantity: 1,
      })

      const item = await db('equipment_items').where({ id: itemId }).first()

      expect(item).toBeDefined()
      expect(item.request_id).toBe(requestId)
      expect(item.equipment_name).toBe('Ноутбук')
      expect(item.serial_number).toBe('SN12345')
      expect(item.quantity).toBe(1)
    })

    it('должна удалять связанные элементы при удалении заявки', async () => {
      await db.schema.createTable('equipment_items', (table) => {
        table.increments('id').primary()
        table.integer('request_id').unsigned().notNullable()
        table.string('equipment_name').notNullable()
        table.string('serial_number').notNullable()
        table.integer('quantity').notNullable().defaultTo(1)
        table.foreign('request_id').references('requests.id').onDelete('CASCADE')
      })

      const [requestId] = await db('requests').insert({
        employee_name: 'Иванов Иван',
        login: 'ivanov',
        created_at: new Date().toISOString(),
      })

      await db('equipment_items').insert({
        request_id: requestId,
        equipment_name: 'Ноутбук',
        serial_number: 'SN12345',
        quantity: 1,
      })

      await db('requests').where({ id: requestId }).delete()

      const items = await db('equipment_items').where({ request_id: requestId })
      expect(items).toHaveLength(0)
    })
  })

  describe('employee_exits table', () => {
    it('должна создаться таблица employee_exits', async () => {
      await db.schema.createTable('employee_exits', (table) => {
        table.increments('id').primary()
        table.string('employee_name').notNullable()
        table.string('login').notNullable()
        table.string('sd_number')
        table.string('exit_date').notNullable()
        table.text('equipment_list').notNullable()
        table.string('created_at').notNullable()
        table.integer('is_completed').notNullable().defaultTo(0)
      })

      const exists = await db.schema.hasTable('employee_exits')
      expect(exists).toBe(true)
    })

    it('должна вставить и получить запись выхода', async () => {
      await db.schema.createTable('employee_exits', (table) => {
        table.increments('id').primary()
        table.string('employee_name').notNullable()
        table.string('login').notNullable()
        table.string('exit_date').notNullable()
        table.text('equipment_list').notNullable()
        table.string('created_at').notNullable()
        table.integer('is_completed').notNullable().defaultTo(0)
      })

      const [id] = await db('employee_exits').insert({
        employee_name: 'Петров Петр',
        login: 'petrov',
        exit_date: '2024-12-31',
        equipment_list: 'Ноутбук\nМышь\nКлавиатура',
        created_at: new Date().toISOString(),
        is_completed: 0,
      })

      const exit = await db('employee_exits').where({ id }).first()

      expect(exit).toBeDefined()
      expect(exit.employee_name).toBe('Петров Петр')
      expect(exit.login).toBe('petrov')
      expect(exit.exit_date).toBe('2024-12-31')
      expect(exit.equipment_list).toContain('Ноутбук')
    })

    it('должна отметить выход как завершенный', async () => {
      await db.schema.createTable('employee_exits', (table) => {
        table.increments('id').primary()
        table.string('employee_name').notNullable()
        table.string('login').notNullable()
        table.string('exit_date').notNullable()
        table.text('equipment_list').notNullable()
        table.string('created_at').notNullable()
        table.integer('is_completed').notNullable().defaultTo(0)
      })

      const [id] = await db('employee_exits').insert({
        employee_name: 'Петров Петр',
        login: 'petrov',
        exit_date: '2024-12-31',
        equipment_list: 'Ноутбук',
        created_at: new Date().toISOString(),
        is_completed: 0,
      })

      await db('employee_exits').where({ id }).update({ is_completed: 1 })

      const exit = await db('employee_exits').where({ id }).first()
      expect(exit.is_completed).toBe(1)
    })
  })

  describe('templates table', () => {
    it('должна создаться таблица templates', async () => {
      await db.schema.createTable('templates', (table) => {
        table.increments('id').primary()
        table.string('title').notNullable()
        table.text('content').notNullable()
        table.string('created_at').notNullable()
        table.string('updated_at').notNullable()
        table.integer('sort_order').notNullable().defaultTo(0)
      })

      const exists = await db.schema.hasTable('templates')
      expect(exists).toBe(true)
    })

    it('должна вставить и получить шаблон', async () => {
      await db.schema.createTable('templates', (table) => {
        table.increments('id').primary()
        table.string('title').notNullable()
        table.text('content').notNullable()
        table.string('created_at').notNullable()
        table.string('updated_at').notNullable()
        table.integer('sort_order').notNullable().defaultTo(0)
      })

      const now = new Date().toISOString()
      const [id] = await db('templates').insert({
        title: 'Мой шаблон',
        content: 'Содержимое шаблона',
        created_at: now,
        updated_at: now,
        sort_order: 0,
      })

      const template = await db('templates').where({ id }).first()

      expect(template).toBeDefined()
      expect(template.title).toBe('Мой шаблон')
      expect(template.content).toBe('Содержимое шаблона')
      expect(template.sort_order).toBe(0)
    })

    it('должна обновить порядок сортировки', async () => {
      await db.schema.createTable('templates', (table) => {
        table.increments('id').primary()
        table.string('title').notNullable()
        table.text('content').notNullable()
        table.string('created_at').notNullable()
        table.string('updated_at').notNullable()
        table.integer('sort_order').notNullable().defaultTo(0)
      })

      const now = new Date().toISOString()
      const [id1] = await db('templates').insert({
        title: 'Шаблон 1',
        content: 'Содержимое 1',
        created_at: now,
        updated_at: now,
        sort_order: 0,
      })

      const [id2] = await db('templates').insert({
        title: 'Шаблон 2',
        content: 'Содержимое 2',
        created_at: now,
        updated_at: now,
        sort_order: 1,
      })

      // Меняем порядок
      await db('templates').where({ id: id1 }).update({ sort_order: 1 })
      await db('templates').where({ id: id2 }).update({ sort_order: 0 })

      const template1 = await db('templates').where({ id: id1 }).first()
      const template2 = await db('templates').where({ id: id2 }).first()

      expect(template1.sort_order).toBe(1)
      expect(template2.sort_order).toBe(0)
    })
  })
})
