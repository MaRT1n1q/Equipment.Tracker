import { app } from 'electron'
import fs from 'fs'
import knex, { type Knex } from 'knex'
import path from 'path'

import { runMigrations } from './migrations'

interface MockRequestSeed {
  employeeName: string
  notes?: string
  isIssued: boolean
  equipment: Array<{ name: string; serial: string; quantity: number }>
}

interface MockEmployeeExitSeed {
  employeeName: string
  login: string
  exitDate: string
  equipmentList: string
  isCompleted: boolean
}

const mockRequestSeeds: MockRequestSeed[] = [
  {
    employeeName: 'Анна Смирнова',
    notes: 'Удалённый онбординг. Нужен ноутбук и гарнитура.',
    isIssued: false,
    equipment: [
      { name: 'Apple MacBook Pro 14" (M3)', serial: 'REQ-001-2025', quantity: 1 },
      { name: 'Jabra Evolve2 65 Headset', serial: 'REQ-001-AUD', quantity: 1 },
    ],
  },
  {
    employeeName: 'Михаил Кузнецов',
    notes: 'Продолжение проекта аналитики, требуется второй монитор.',
    isIssued: true,
    equipment: [
      { name: 'Dell Latitude 7440', serial: 'REQ-002-2025', quantity: 1 },
      { name: 'Dell UltraSharp 27"', serial: 'REQ-002-DIS', quantity: 1 },
    ],
  },
  {
    employeeName: 'Екатерина Орлова',
    notes: 'Дизайнер. Нужна графическая станция и планшет.',
    isIssued: false,
    equipment: [
      { name: 'Apple MacBook Pro 16" (M3 Max)', serial: 'REQ-003-2025', quantity: 1 },
      { name: 'Wacom Intuos Pro M', serial: 'REQ-003-TAB', quantity: 1 },
    ],
  },
  {
    employeeName: 'Наталья Романова',
    notes: 'Сменный ноутбук после поломки старого.',
    isIssued: true,
    equipment: [{ name: 'Lenovo ThinkPad X1 Carbon Gen 12', serial: 'REQ-004-2025', quantity: 1 }],
  },
  {
    employeeName: 'Алексей Егоров',
    notes: 'Расширение команды поддержки. Нужны гарнитура и веб-камера.',
    isIssued: false,
    equipment: [
      { name: 'Logitech C925e Webcam', serial: 'REQ-005-CAM', quantity: 1 },
      { name: 'Plantronics Voyager Focus 2', serial: 'REQ-005-HS', quantity: 1 },
    ],
  },
  {
    employeeName: 'Иван Волков',
    notes: 'Инженер DevOps. Запасной ноутбук для дежурств.',
    isIssued: true,
    equipment: [{ name: 'HP ZBook Firefly 14', serial: 'REQ-006-2025', quantity: 1 }],
  },
  {
    employeeName: 'Светлана Петрова',
    notes: 'Сборка рабочего места на новом этаже.',
    isIssued: false,
    equipment: [
      { name: 'Dell OptiPlex 7010 SFF', serial: 'REQ-007-CPU', quantity: 1 },
      { name: 'Dell P2419H Monitor', serial: 'REQ-007-DIS1', quantity: 2 },
      { name: 'Logitech MX Keys', serial: 'REQ-007-KB', quantity: 1 },
    ],
  },
  {
    employeeName: 'Роман Соколов',
    notes: 'Полевой инженер. Требуются защищённые устройства.',
    isIssued: true,
    equipment: [
      { name: 'Panasonic Toughbook 55', serial: 'REQ-008-2025', quantity: 1 },
      { name: 'CAT S75 Smartphone', serial: 'REQ-008-MOB', quantity: 1 },
    ],
  },
  {
    employeeName: 'Ольга Белова',
    notes: 'Маркетинг. Запрос на ноутбук и комплект для презентаций.',
    isIssued: false,
    equipment: [
      { name: 'Microsoft Surface Laptop 6', serial: 'REQ-009-2025', quantity: 1 },
      { name: 'Razer Pro Click Mouse', serial: 'REQ-009-MOU', quantity: 1 },
      { name: 'Logitech Spotlight Presenter', serial: 'REQ-009-PRS', quantity: 1 },
    ],
  },
  {
    employeeName: 'Павел Крылов',
    notes: 'Разработка. Требуется мощный ноутбук и монитор.',
    isIssued: true,
    equipment: [
      { name: 'Lenovo ThinkPad P16', serial: 'REQ-010-2025', quantity: 1 },
      { name: 'LG UltraFine 27"', serial: 'REQ-010-DIS', quantity: 1 },
    ],
  },
  {
    employeeName: 'Мария Жукова',
    notes: 'Замена устаревшего ноутбука.',
    isIssued: false,
    equipment: [{ name: 'HP EliteBook 840 G11', serial: 'REQ-011-2025', quantity: 1 }],
  },
  {
    employeeName: 'Денис Морозов',
    notes: 'Участие в пилотном проекте AR.',
    isIssued: true,
    equipment: [
      { name: 'ASUS ROG Zephyrus G16', serial: 'REQ-012-2025', quantity: 1 },
      { name: 'Meta Quest 3', serial: 'REQ-012-AR', quantity: 1 },
    ],
  },
  {
    employeeName: 'Юлия Фомина',
    notes: 'HR. Нужен лёгкий ноутбук и планшет для интервью.',
    isIssued: false,
    equipment: [
      { name: 'Apple MacBook Air 13" (M2)', serial: 'REQ-013-2025', quantity: 1 },
      { name: 'Apple iPad Air (2024)', serial: 'REQ-013-IPD', quantity: 1 },
    ],
  },
  {
    employeeName: 'Кирилл Логинов',
    notes: 'Backend разработчик. Просьба добавить док-станцию.',
    isIssued: true,
    equipment: [
      { name: 'Dell Precision 5680', serial: 'REQ-014-2025', quantity: 1 },
      { name: 'CalDigit TS4 Dock', serial: 'REQ-014-DCK', quantity: 1 },
    ],
  },
  {
    employeeName: 'Вероника Лебедева',
    notes: 'QA. Нужен монитор с высоким разрешением.',
    isIssued: false,
    equipment: [
      { name: 'Acer Swift 5', serial: 'REQ-015-2025', quantity: 1 },
      { name: 'Samsung Odyssey G5 32"', serial: 'REQ-015-DIS', quantity: 1 },
    ],
  },
  {
    employeeName: 'Георгий Киселёв',
    notes: 'Data Science. Требуется станция с GPU.',
    isIssued: true,
    equipment: [
      { name: 'HP ZBook Studio G10', serial: 'REQ-016-2025', quantity: 1 },
      { name: 'NVIDIA RTX 4000 Ada eGPU', serial: 'REQ-016-GPU', quantity: 1 },
    ],
  },
  {
    employeeName: 'Алина Брагина',
    notes: 'Customer success. Нужен комплект для переговоров.',
    isIssued: false,
    equipment: [
      { name: 'Lenovo ThinkPad T14s', serial: 'REQ-017-2025', quantity: 1 },
      { name: 'Poly Sync 20 Speakerphone', serial: 'REQ-017-SPK', quantity: 1 },
    ],
  },
  {
    employeeName: 'Сергей Ковалёв',
    notes: 'Инфраструктура. Дополнительный монитор и клавиатура.',
    isIssued: true,
    equipment: [
      { name: 'Gigabyte AERO 16', serial: 'REQ-018-2025', quantity: 1 },
      { name: 'Keychron K8 Pro', serial: 'REQ-018-KB', quantity: 1 },
      { name: 'BenQ PD3220U', serial: 'REQ-018-DIS', quantity: 1 },
    ],
  },
  {
    employeeName: 'Татьяна Захарова',
    notes: 'Финансы. Комплект для подсчёта и печати.',
    isIssued: false,
    equipment: [
      { name: 'Dell Latitude 5450', serial: 'REQ-019-2025', quantity: 1 },
      { name: 'Epson EcoTank L6580', serial: 'REQ-019-PRN', quantity: 1 },
      { name: 'Canon DR-C240 Scanner', serial: 'REQ-019-SCN', quantity: 1 },
    ],
  },
  {
    employeeName: 'Олег Тимофеев',
    notes: 'Security. Нужны тестовые устройства.',
    isIssued: true,
    equipment: [
      { name: 'Framework Laptop 16', serial: 'REQ-020-2025', quantity: 1 },
      { name: 'Google Pixel 9 Pro', serial: 'REQ-020-AND', quantity: 1 },
      { name: 'iPhone 16 Pro', serial: 'REQ-020-IOS', quantity: 1 },
    ],
  },
]

const mockEmployeeExitSeeds: MockEmployeeExitSeed[] = [
  {
    employeeName: 'Дмитрий Петров',
    login: 'd.petrov',
    exitDate: '2025-11-28',
    equipmentList: '- MacBook Pro 13"\n- Монитор Dell 27"\n- Гарнитура Jabra',
    isCompleted: false,
  },
  {
    employeeName: 'Елена Сафонова',
    login: 'e.safonova',
    exitDate: '2025-11-26',
    equipmentList: '- Lenovo ThinkPad T14\n- Беспроводная мышь Logitech',
    isCompleted: true,
  },
  {
    employeeName: 'Артём Васильев',
    login: 'a.vasilev',
    exitDate: '2025-11-23',
    equipmentList: '- Dell Latitude 5410\n- Смартфон Samsung A55',
    isCompleted: false,
  },
  {
    employeeName: 'Лидия Сергеева',
    login: 'l.sergeeva',
    exitDate: '2025-11-20',
    equipmentList: '- HP EliteBook 840\n- Док-станция HP USB-C G5',
    isCompleted: true,
  },
  {
    employeeName: 'Константин Афанасьев',
    login: 'k.afanasyev',
    exitDate: '2025-11-18',
    equipmentList: '- MacBook Air 15"\n- Magic Keyboard\n- Magic Trackpad',
    isCompleted: false,
  },
  {
    employeeName: 'Жанна Осипова',
    login: 'zh.osipova',
    exitDate: '2025-11-15',
    equipmentList: '- ASUS ZenBook 14\n- Монитор Philips 24"',
    isCompleted: true,
  },
  {
    employeeName: 'Руслан Литвинов',
    login: 'r.litvinov',
    exitDate: '2025-11-12',
    equipmentList: '- Lenovo Legion 5\n- Наушники HyperX Cloud',
    isCompleted: false,
  },
  {
    employeeName: 'София Нестерова',
    login: 's.nesterova',
    exitDate: '2025-11-08',
    equipmentList: '- Microsoft Surface Laptop 5\n- Surface Pen',
    isCompleted: true,
  },
  {
    employeeName: 'Игорь Кравцов',
    login: 'i.kravtsov',
    exitDate: '2025-11-05',
    equipmentList: '- HP ZBook Power\n- Монитор LG 29" UltraWide',
    isCompleted: false,
  },
  {
    employeeName: 'Полина Тюрина',
    login: 'p.tyurina',
    exitDate: '2025-11-03',
    equipmentList: '- Acer Swift X 14\n- Гарнитура Logitech Zone',
    isCompleted: true,
  },
  {
    employeeName: 'Григорий Дьяков',
    login: 'g.dyakov',
    exitDate: '2025-10-31',
    equipmentList: '- Dell Precision 3561\n- Планшет iPad 10',
    isCompleted: false,
  },
  {
    employeeName: 'Виктория Степанова',
    login: 'v.stepanova',
    exitDate: '2025-10-28',
    equipmentList: '- HP Elite Dragonfly\n- Чехол-клавиатура Logitech Folio',
    isCompleted: true,
  },
  {
    employeeName: 'Максим Ширяев',
    login: 'm.shiryaev',
    exitDate: '2025-10-25',
    equipmentList: '- Lenovo ThinkPad P1\n- Монитор BenQ 27"',
    isCompleted: false,
  },
  {
    employeeName: 'Эльза Громова',
    login: 'e.gromova',
    exitDate: '2025-10-22',
    equipmentList: '- Apple MacBook Pro 14"\n- AirPods Pro 2',
    isCompleted: true,
  },
  {
    employeeName: 'Оскар Вавилов',
    login: 'o.vavilov',
    exitDate: '2025-10-19',
    equipmentList: '- ASUS ProArt Studiobook\n- Графический планшет Huion',
    isCompleted: false,
  },
  {
    employeeName: 'Ксения Ларионова',
    login: 'k.larionova',
    exitDate: '2025-10-16',
    equipmentList: '- Microsoft Surface Pro 10\n- Surface Dock 2',
    isCompleted: true,
  },
  {
    employeeName: 'Пётр Астахов',
    login: 'p.astakhov',
    exitDate: '2025-10-13',
    equipmentList: '- Dell XPS 15\n- Клавиатура Keychron K4',
    isCompleted: false,
  },
  {
    employeeName: 'Рита Королёва',
    login: 'r.koroleva',
    exitDate: '2025-10-10',
    equipmentList: '- HP Spectre x360\n- Мышь Logitech MX Anywhere 3',
    isCompleted: true,
  },
  {
    employeeName: 'Семён Гусев',
    login: 's.gusev',
    exitDate: '2025-10-07',
    equipmentList: '- Lenovo Yoga 7\n- Наушники Sony WH-CH720N',
    isCompleted: false,
  },
  {
    employeeName: 'Инга Лобанова',
    login: 'i.lobanova',
    exitDate: '2025-10-04',
    equipmentList: '- Apple MacBook Air 13"\n- iPhone 15',
    isCompleted: true,
  },
]

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
  const now = Date.now()

  await database.transaction(async (trx) => {
    for (const [index, seed] of mockRequestSeeds.entries()) {
      const createdAt = new Date(now - index * 36 * 60 * 60 * 1000).toISOString()
      const issuedAt = seed.isIssued
        ? new Date(now - index * 36 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString()
        : null

      const insertResult = await trx('requests').insert({
        employee_name: seed.employeeName,
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
  const now = Date.now()

  const rows = mockEmployeeExitSeeds.map((seed, index) => ({
    employee_name: seed.employeeName,
    login: seed.login,
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

export { getDatabasePath }
