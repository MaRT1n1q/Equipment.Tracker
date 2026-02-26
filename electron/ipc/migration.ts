/**
 * IPC-хендлеры для одноразовой миграции данных из локальной SQLite-базы
 * (старые версии приложения) на сервер.
 *
 * Каналы:
 *  - 'migration:status'   — проверить состояние (нужна ли миграция)
 *  - 'migration:run'      — запустить миграцию
 */

import { app, ipcMain } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import knex, { type Knex } from 'knex'

// ─── Константы ────────────────────────────────────────────────────────────────

const MIGRATION_FLAG_FILE = 'migration_done_v1.flag'
const LOCAL_DB_FILENAME = 'equipment.db'
// Папка с файлами шаблонов / вложениями в старом приложении совпадает с userData
const LEGACY_TEMPLATE_FILES_DIR = 'template_files'
const LEGACY_ATTACHMENTS_DIR = 'instruction_attachments'

// ─── Типы ─────────────────────────────────────────────────────────────────────

interface MigrationStatus {
  needed: boolean // true — есть локальная БД и миграция не выполнена
  done: boolean // true — флаг-файл существует
  dbExists: boolean // true — файл equipment.db найден
  counts?: {
    requests: number
    employee_exits: number
    templates: number
    instructions: number
  }
}

interface MigrationRunPayload {
  apiBaseUrl: string
  accessToken: string
}

interface MigrationResult {
  success: boolean
  imported?: {
    requests: number
    employee_exits: number
    templates: number
    template_files: number
    instructions: number
    instruction_attachments: number
  }
  error?: string
}

// ─── Утилиты ──────────────────────────────────────────────────────────────────

function getUserDataDir(): string {
  return app.getPath('userData')
}

function getFlagPath(): string {
  return path.join(getUserDataDir(), MIGRATION_FLAG_FILE)
}

function getDbPath(): string {
  return path.join(getUserDataDir(), LOCAL_DB_FILENAME)
}

function isMigrationDone(): boolean {
  return fs.existsSync(getFlagPath())
}

function markMigrationDone(): void {
  fs.writeFileSync(getFlagPath(), new Date().toISOString(), 'utf8')
}

function fileToBase64(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null
    return fs.readFileSync(filePath).toString('base64')
  } catch {
    return null
  }
}

// ─── Чтение данных из SQLite ──────────────────────────────────────────────────

async function readLocalData(db: Knex) {
  // Заявки + позиции оборудования
  const rawRequests = await db('requests').select('*')
  const rawItems = await db('equipment_items').select('*')

  // Группируем позиции по request_id
  const itemsByRequest: Record<number, object[]> = {}
  for (const item of rawItems) {
    const rid = (item as { request_id: number }).request_id
    if (!itemsByRequest[rid]) itemsByRequest[rid] = []
    itemsByRequest[rid].push({
      equipment_name: (item as Record<string, unknown>).equipment_name ?? '',
      serial_number: (item as Record<string, unknown>).serial_number ?? '',
      quantity: (item as Record<string, unknown>).quantity ?? 1,
      status: (item as Record<string, unknown>).status ?? 'in_stock',
    })
  }

  const requests = rawRequests.map((r: Record<string, unknown>) => ({
    employee_name: r.employee_name ?? '',
    login: r.login ?? '',
    sd_number: r.sd_number ?? null,
    delivery_url: r.delivery_url ?? null,
    notes: r.notes ?? null,
    is_issued: Boolean(r.is_issued),
    issued_at: r.issued_at ?? null,
    return_required: Boolean(r.return_required),
    return_due_date: r.return_due_date ?? null,
    return_equipment: r.return_equipment ?? null,
    return_completed: Boolean(r.return_completed),
    return_completed_at: r.return_completed_at ?? null,
    return_scheduled_at: r.return_scheduled_at ?? null,
    created_at: r.created_at ?? new Date().toISOString(),
    equipment_items: itemsByRequest[r.id as number] ?? [],
  }))

  // Увольнения
  const rawExits = await db('employee_exits').select('*')
  const employee_exits = rawExits.map((e: Record<string, unknown>) => ({
    employee_name: e.employee_name ?? '',
    login: e.login ?? '',
    sd_number: e.sd_number ?? null,
    delivery_url: e.delivery_url ?? null,
    exit_date: e.exit_date ?? new Date().toISOString().slice(0, 10),
    equipment_list: e.equipment_list ?? '',
    is_completed: Boolean(e.is_completed),
    created_at: e.created_at ?? new Date().toISOString(),
  }))

  // Шаблоны
  const rawTemplates = await db('templates').select('*').orderBy('sort_order')
  const rawTemplateFiles = await db('template_files').select('*')

  const userData = getUserDataDir()
  const templates = rawTemplates.map((t: Record<string, unknown>) => {
    const tid = t.id as number
    const files = rawTemplateFiles
      .filter((f: Record<string, unknown>) => (f.template_id as number) === tid)
      .map((f: Record<string, unknown>) => {
        const filePath = path.join(userData, LEGACY_TEMPLATE_FILES_DIR, f.filename as string)
        return {
          original_name: f.original_name ?? f.filename,
          mime_type: f.mime_type ?? 'application/octet-stream',
          base64_data: fileToBase64(filePath) ?? '',
        }
      })
      .filter((f) => f.base64_data !== '')

    return {
      local_id: tid,
      title: t.title ?? '',
      content: t.content ?? '',
      sort_order: t.sort_order ?? 0,
      files,
    }
  })

  // Инструкции
  const rawInstructions = await db('instructions').select('*').orderBy('sort_order')
  const rawAttachments = await db('instruction_attachments').select('*')

  const instructions = rawInstructions.map((i: Record<string, unknown>) => {
    const iid = i.id as number
    const files = rawAttachments
      .filter((a: Record<string, unknown>) => (a.instruction_id as number) === iid)
      .map((a: Record<string, unknown>) => {
        const filePath = path.join(userData, LEGACY_ATTACHMENTS_DIR, a.filename as string)
        return {
          original_name: a.original_name ?? a.filename,
          mime_type: a.mime_type ?? 'application/octet-stream',
          base64_data: fileToBase64(filePath) ?? '',
        }
      })
      .filter((f) => f.base64_data !== '')

    // Теги: могут быть JSON-строкой или уже массивом
    let tags: string[] = []
    try {
      const rawTags = i.tags
      if (typeof rawTags === 'string' && rawTags.startsWith('[')) {
        tags = JSON.parse(rawTags) as string[]
      }
    } catch {
      tags = []
    }

    return {
      local_id: iid,
      local_parent: (i.parent_id as number | null) ?? null,
      title: i.title ?? '',
      content: i.content ?? '',
      sort_order: i.sort_order ?? 0,
      is_folder: Boolean(i.is_folder),
      is_favorite: Boolean(i.is_favorite),
      tags,
      files,
    }
  })

  return { requests, employee_exits, templates, instructions }
}

// ─── Регистрация IPC-хендлеров ────────────────────────────────────────────────

export function registerMigrationHandlers(): void {
  // ── migration:status ──────────────────────────────────────────────────────
  ipcMain.handle('migration:status', async (): Promise<MigrationStatus> => {
    const dbPath = getDbPath()
    const dbExists = fs.existsSync(dbPath)
    const done = isMigrationDone()

    if (!dbExists || done) {
      return { needed: false, done, dbExists }
    }

    // Считываем количество записей для отображения пользователю
    try {
      const db = knex({
        client: 'sqlite3',
        connection: { filename: dbPath },
        useNullAsDefault: true,
      })
      const [reqCount, exitCount, tmplCount, instCount] = await Promise.all([
        db('requests').count('* as n').first(),
        db('employee_exits').count('* as n').first(),
        db('templates').count('* as n').first(),
        db('instructions').count('* as n').first(),
      ])
      await db.destroy()

      return {
        needed: true,
        done: false,
        dbExists: true,
        counts: {
          requests: Number((reqCount as { n: number })?.n ?? 0),
          employee_exits: Number((exitCount as { n: number })?.n ?? 0),
          templates: Number((tmplCount as { n: number })?.n ?? 0),
          instructions: Number((instCount as { n: number })?.n ?? 0),
        },
      }
    } catch (err) {
      console.error('[migration] failed to read local DB:', err)
      return { needed: false, done: false, dbExists: true }
    }
  })

  // ── migration:run ─────────────────────────────────────────────────────────
  ipcMain.handle(
    'migration:run',
    async (_event, payload: MigrationRunPayload): Promise<MigrationResult> => {
      const dbPath = getDbPath()

      if (isMigrationDone()) {
        return { success: true, error: 'Миграция уже выполнена' }
      }

      if (!fs.existsSync(dbPath)) {
        return { success: false, error: 'Локальная база данных не найдена' }
      }

      let db: Knex | null = null
      try {
        db = knex({
          client: 'sqlite3',
          connection: { filename: dbPath },
          useNullAsDefault: true,
        })

        const data = await readLocalData(db)

        const apiUrl = payload.apiBaseUrl.replace(/\/$/, '') + '/api/v1/migrate/import'
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${payload.accessToken}`,
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          let errMsg = `HTTP ${response.status}`
          try {
            const body = (await response.json()) as { error?: { message?: string } }
            errMsg = body.error?.message ?? errMsg
          } catch {
            // ignore json parse error
          }
          return { success: false, error: errMsg }
        }

        const result = (await response.json()) as {
          success: boolean
          imported: MigrationResult['imported']
        }

        // Сохраняем флаг только при успехе
        markMigrationDone()

        return { success: true, imported: result.imported }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Неизвестная ошибка'
        return { success: false, error: message }
      } finally {
        if (db) {
          try {
            await db.destroy()
          } catch {
            // ignore
          }
        }
      }
    }
  )

  // ── migration:skip (пользователь отказался) ────────────────────────────────
  ipcMain.handle('migration:skip', async (): Promise<void> => {
    markMigrationDone()
  })
}
