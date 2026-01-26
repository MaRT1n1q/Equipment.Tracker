import { app, dialog, ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { z } from 'zod'

import { getDatabase } from '../database'
import {
  createInstructionSchema,
  updateInstructionSchema,
  moveInstructionSchema,
  reorderInstructionsSchema,
} from '../../src/types/ipc'
import type { ApiResponse, Instruction, InstructionAttachment } from '../../src/types/ipc'

interface InstructionRow {
  id: number
  parent_id: number | null
  title: string
  content: string
  sort_order: number
  is_folder: number
  is_favorite: number
  tags: string
  created_at: string
  updated_at: string
}

interface AttachmentRow {
  id: number
  instruction_id: number
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  created_at: string
}

function rowToInstruction(row: InstructionRow): Instruction {
  let tags: string[] = []
  try {
    tags = row.tags ? JSON.parse(row.tags) : []
  } catch {
    tags = []
  }

  return {
    id: row.id,
    parent_id: row.parent_id,
    title: row.title,
    content: row.content,
    sort_order: row.sort_order,
    is_folder: row.is_folder,
    is_favorite: row.is_favorite,
    tags,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function rowToAttachment(row: AttachmentRow): InstructionAttachment {
  return {
    id: row.id,
    instruction_id: row.instruction_id,
    filename: row.filename,
    original_name: row.original_name,
    file_size: row.file_size,
    mime_type: row.mime_type,
    created_at: row.created_at,
  }
}

function getAttachmentsDirectory(): string {
  return path.join(app.getPath('userData'), 'instruction_attachments')
}

function ensureAttachmentsDirectory(): void {
  const dir = getAttachmentsDirectory()
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function registerInstructionsHandlers(): void {
  // Получить все инструкции (плоский список)
  ipcMain.handle('get-instructions', async (): Promise<ApiResponse<Instruction[]>> => {
    try {
      const db = getDatabase()
      const rows = await db<InstructionRow>('instructions')
        .select('*')
        .orderBy('parent_id', 'asc')
        .orderBy('sort_order', 'asc')

      return { success: true, data: rows.map(rowToInstruction) }
    } catch (error) {
      console.error('Ошибка получения инструкций:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Не удалось загрузить инструкции',
      }
    }
  })

  // Получить инструкцию по ID
  ipcMain.handle(
    'get-instruction',
    async (_event, id: number): Promise<ApiResponse<Instruction>> => {
      try {
        const db = getDatabase()
        const idParsed = z.number().int().positive().parse(id)

        const row = await db<InstructionRow>('instructions').where({ id: idParsed }).first()

        if (!row) {
          return { success: false, error: 'Инструкция не найдена' }
        }

        return { success: true, data: rowToInstruction(row) }
      } catch (error) {
        console.error('Ошибка получения инструкции:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Не удалось загрузить инструкцию',
        }
      }
    }
  )

  // Создать инструкцию
  ipcMain.handle(
    'create-instruction',
    async (_event, data: unknown): Promise<ApiResponse<Instruction>> => {
      try {
        const db = getDatabase()
        const parsed = createInstructionSchema.parse(data)
        const now = new Date().toISOString()

        // Получить максимальный sort_order для данного parent_id
        const maxOrderResult = await db('instructions')
          .where('parent_id', parsed.parent_id ?? null)
          .max('sort_order as maxOrder')
          .first<{ maxOrder: number | null }>()

        const sortOrder = (maxOrderResult?.maxOrder ?? -1) + 1

        const [insertedId] = await db('instructions').insert({
          parent_id: parsed.parent_id ?? null,
          title: parsed.title,
          content: parsed.content ?? '',
          is_folder: parsed.is_folder ? 1 : 0,
          is_favorite: 0,
          tags: JSON.stringify(parsed.tags ?? []),
          sort_order: sortOrder,
          created_at: now,
          updated_at: now,
        })

        const created = await db<InstructionRow>('instructions').where({ id: insertedId }).first()

        if (!created) {
          return { success: false, error: 'Не удалось создать инструкцию' }
        }

        return { success: true, data: rowToInstruction(created), id: insertedId }
      } catch (error) {
        console.error('Ошибка создания инструкции:', error)
        if (error instanceof z.ZodError) {
          return { success: false, error: error.issues[0]?.message ?? 'Ошибка валидации' }
        }
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Не удалось создать инструкцию',
        }
      }
    }
  )

  // Обновить инструкцию
  ipcMain.handle(
    'update-instruction',
    async (_event, id: number, data: unknown): Promise<ApiResponse<Instruction>> => {
      try {
        const db = getDatabase()
        const idParsed = z.number().int().positive().parse(id)
        const parsed = updateInstructionSchema.parse(data)
        const now = new Date().toISOString()

        const updateData: Partial<InstructionRow> = { updated_at: now }

        if (parsed.title !== undefined) {
          updateData.title = parsed.title
        }
        if (parsed.content !== undefined) {
          updateData.content = parsed.content
        }
        if (parsed.is_folder !== undefined) {
          updateData.is_folder = parsed.is_folder ? 1 : 0
        }
        if (parsed.tags !== undefined) {
          updateData.tags = JSON.stringify(parsed.tags)
        }

        await db('instructions').where({ id: idParsed }).update(updateData)

        const updated = await db<InstructionRow>('instructions').where({ id: idParsed }).first()

        if (!updated) {
          return { success: false, error: 'Инструкция не найдена' }
        }

        return { success: true, data: rowToInstruction(updated) }
      } catch (error) {
        console.error('Ошибка обновления инструкции:', error)
        if (error instanceof z.ZodError) {
          return { success: false, error: error.issues[0]?.message ?? 'Ошибка валидации' }
        }
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Не удалось обновить инструкцию',
        }
      }
    }
  )

  // Переместить инструкцию (изменить parent и/или sort_order)
  ipcMain.handle(
    'move-instruction',
    async (_event, id: number, data: unknown): Promise<ApiResponse<Instruction>> => {
      try {
        const db = getDatabase()
        const idParsed = z.number().int().positive().parse(id)
        const parsed = moveInstructionSchema.parse(data)
        const now = new Date().toISOString()

        // Проверить что не перемещаем в себя или в своих потомков
        if (parsed.parent_id !== null) {
          const isDescendant = await checkIsDescendant(db, idParsed, parsed.parent_id)
          if (isDescendant) {
            return { success: false, error: 'Нельзя переместить папку в свою дочернюю папку' }
          }
        }

        await db('instructions').where({ id: idParsed }).update({
          parent_id: parsed.parent_id,
          sort_order: parsed.sort_order,
          updated_at: now,
        })

        const updated = await db<InstructionRow>('instructions').where({ id: idParsed }).first()

        if (!updated) {
          return { success: false, error: 'Инструкция не найдена' }
        }

        return { success: true, data: rowToInstruction(updated) }
      } catch (error) {
        console.error('Ошибка перемещения инструкции:', error)
        if (error instanceof z.ZodError) {
          return { success: false, error: error.issues[0]?.message ?? 'Ошибка валидации' }
        }
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Не удалось переместить инструкцию',
        }
      }
    }
  )

  // Переупорядочить инструкции внутри одного родителя
  ipcMain.handle('reorder-instructions', async (_event, data: unknown): Promise<ApiResponse> => {
    try {
      const db = getDatabase()
      const parsed = reorderInstructionsSchema.parse(data)
      const now = new Date().toISOString()

      await db.transaction(async (trx) => {
        for (let i = 0; i < parsed.order.length; i++) {
          await trx('instructions')
            .where({ id: parsed.order[i] })
            .update({ sort_order: i, updated_at: now })
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Ошибка переупорядочивания инструкций:', error)
      if (error instanceof z.ZodError) {
        return { success: false, error: error.issues[0]?.message ?? 'Ошибка валидации' }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Не удалось переупорядочить инструкции',
      }
    }
  })

  // Удалить инструкцию (вместе со всеми дочерними)
  ipcMain.handle(
    'delete-instruction',
    async (_event, id: number): Promise<ApiResponse<Instruction>> => {
      try {
        const db = getDatabase()
        const idParsed = z.number().int().positive().parse(id)

        const existing = await db<InstructionRow>('instructions').where({ id: idParsed }).first()

        if (!existing) {
          return { success: false, error: 'Инструкция не найдена' }
        }

        // CASCADE удаление настроено в схеме БД, но для безопасности удаляем рекурсивно
        await deleteInstructionRecursive(db, idParsed)

        return { success: true, data: rowToInstruction(existing) }
      } catch (error) {
        console.error('Ошибка удаления инструкции:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Не удалось удалить инструкцию',
        }
      }
    }
  )

  // Дублировать инструкцию
  ipcMain.handle(
    'duplicate-instruction',
    async (_event, id: number): Promise<ApiResponse<Instruction>> => {
      try {
        const db = getDatabase()
        const idParsed = z.number().int().positive().parse(id)

        const original = await db<InstructionRow>('instructions').where({ id: idParsed }).first()

        if (!original) {
          return { success: false, error: 'Инструкция не найдена' }
        }

        const now = new Date().toISOString()

        // Получить максимальный sort_order
        const maxOrderResult = await db('instructions')
          .where('parent_id', original.parent_id)
          .max('sort_order as maxOrder')
          .first<{ maxOrder: number | null }>()

        const sortOrder = (maxOrderResult?.maxOrder ?? -1) + 1

        const [insertedId] = await db('instructions').insert({
          parent_id: original.parent_id,
          title: `${original.title} (копия)`,
          content: original.content,
          is_folder: original.is_folder,
          is_favorite: 0,
          tags: original.tags,
          sort_order: sortOrder,
          created_at: now,
          updated_at: now,
        })

        // Если это папка, рекурсивно скопировать дочерние элементы
        if (original.is_folder === 1) {
          await duplicateChildrenRecursive(db, idParsed, insertedId, now)
        }

        const created = await db<InstructionRow>('instructions').where({ id: insertedId }).first()

        if (!created) {
          return { success: false, error: 'Не удалось дублировать инструкцию' }
        }

        return { success: true, data: rowToInstruction(created), id: insertedId }
      } catch (error) {
        console.error('Ошибка дублирования инструкции:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Не удалось дублировать инструкцию',
        }
      }
    }
  )

  // Переключить избранное
  ipcMain.handle(
    'toggle-instruction-favorite',
    async (_event, id: number): Promise<ApiResponse<Instruction>> => {
      try {
        const db = getDatabase()
        const idParsed = z.number().int().positive().parse(id)

        const existing = await db<InstructionRow>('instructions').where({ id: idParsed }).first()

        if (!existing) {
          return { success: false, error: 'Инструкция не найдена' }
        }

        const newFavorite = existing.is_favorite === 1 ? 0 : 1
        const now = new Date().toISOString()

        await db('instructions')
          .where({ id: idParsed })
          .update({ is_favorite: newFavorite, updated_at: now })

        const updated = await db<InstructionRow>('instructions').where({ id: idParsed }).first()

        return { success: true, data: rowToInstruction(updated!) }
      } catch (error) {
        console.error('Ошибка переключения избранного:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Не удалось обновить избранное',
        }
      }
    }
  )

  // Обновить теги инструкции
  ipcMain.handle(
    'update-instruction-tags',
    async (_event, id: number, tags: string[]): Promise<ApiResponse<Instruction>> => {
      try {
        const db = getDatabase()
        const idParsed = z.number().int().positive().parse(id)
        const parsedTags = z.array(z.string().trim()).parse(tags)

        const existing = await db<InstructionRow>('instructions').where({ id: idParsed }).first()

        if (!existing) {
          return { success: false, error: 'Инструкция не найдена' }
        }

        const now = new Date().toISOString()

        await db('instructions')
          .where({ id: idParsed })
          .update({ tags: JSON.stringify(parsedTags), updated_at: now })

        const updated = await db<InstructionRow>('instructions').where({ id: idParsed }).first()

        return { success: true, data: rowToInstruction(updated!) }
      } catch (error) {
        console.error('Ошибка обновления тегов:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Не удалось обновить теги',
        }
      }
    }
  )

  // Получить все уникальные теги
  ipcMain.handle('get-all-instruction-tags', async (): Promise<ApiResponse<string[]>> => {
    try {
      const db = getDatabase()
      const rows = await db<InstructionRow>('instructions').select('tags')

      const allTags = new Set<string>()
      for (const row of rows) {
        try {
          const tags = row.tags ? JSON.parse(row.tags) : []
          if (Array.isArray(tags)) {
            tags.forEach((tag: string) => {
              if (tag && typeof tag === 'string') {
                allTags.add(tag)
              }
            })
          }
        } catch {
          // Игнорируем ошибки парсинга
        }
      }

      return { success: true, data: Array.from(allTags).sort() }
    } catch (error) {
      console.error('Ошибка получения тегов:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Не удалось получить теги',
      }
    }
  })

  // === Вложения ===

  // Получить вложения инструкции
  ipcMain.handle(
    'get-instruction-attachments',
    async (_event, instructionId: number): Promise<ApiResponse<InstructionAttachment[]>> => {
      try {
        const db = getDatabase()
        const idParsed = z.number().int().positive().parse(instructionId)

        const rows = await db<AttachmentRow>('instruction_attachments')
          .where({ instruction_id: idParsed })
          .orderBy('created_at', 'desc')

        return { success: true, data: rows.map(rowToAttachment) }
      } catch (error) {
        console.error('Ошибка получения вложений:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Не удалось загрузить вложения',
        }
      }
    }
  )

  // Добавить вложение
  ipcMain.handle(
    'add-instruction-attachment',
    async (
      _event,
      instructionId: number,
      filePath: string
    ): Promise<ApiResponse<InstructionAttachment>> => {
      try {
        const db = getDatabase()
        const idParsed = z.number().int().positive().parse(instructionId)

        // Проверяем существование инструкции
        const instruction = await db('instructions').where({ id: idParsed }).first()
        if (!instruction) {
          return { success: false, error: 'Инструкция не найдена' }
        }

        // Проверяем существование файла
        if (!fs.existsSync(filePath)) {
          return { success: false, error: 'Файл не найден' }
        }

        ensureAttachmentsDirectory()

        const stats = fs.statSync(filePath)
        const originalName = path.basename(filePath)
        const ext = path.extname(originalName)
        const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`
        const destPath = path.join(getAttachmentsDirectory(), uniqueName)

        // Копируем файл
        fs.copyFileSync(filePath, destPath)

        // Определяем MIME тип
        const mimeTypes: Record<string, string> = {
          '.pdf': 'application/pdf',
          '.doc': 'application/msword',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          '.xls': 'application/vnd.ms-excel',
          '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml',
          '.txt': 'text/plain',
          '.zip': 'application/zip',
          '.rar': 'application/x-rar-compressed',
          '.7z': 'application/x-7z-compressed',
        }
        const mimeType = mimeTypes[ext.toLowerCase()] || 'application/octet-stream'

        const now = new Date().toISOString()

        const [insertedId] = await db('instruction_attachments').insert({
          instruction_id: idParsed,
          filename: uniqueName,
          original_name: originalName,
          file_size: stats.size,
          mime_type: mimeType,
          created_at: now,
        })

        const created = await db<AttachmentRow>('instruction_attachments')
          .where({ id: insertedId })
          .first()

        return { success: true, data: rowToAttachment(created!) }
      } catch (error) {
        console.error('Ошибка добавления вложения:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Не удалось добавить вложение',
        }
      }
    }
  )

  // Удалить вложение
  ipcMain.handle(
    'delete-instruction-attachment',
    async (_event, attachmentId: number): Promise<ApiResponse> => {
      try {
        const db = getDatabase()
        const idParsed = z.number().int().positive().parse(attachmentId)

        const attachment = await db<AttachmentRow>('instruction_attachments')
          .where({ id: idParsed })
          .first()

        if (!attachment) {
          return { success: false, error: 'Вложение не найдено' }
        }

        // Удаляем файл с диска
        const filePath = path.join(getAttachmentsDirectory(), attachment.filename)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }

        // Удаляем запись из БД
        await db('instruction_attachments').where({ id: idParsed }).delete()

        return { success: true }
      } catch (error) {
        console.error('Ошибка удаления вложения:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Не удалось удалить вложение',
        }
      }
    }
  )

  // Открыть вложение
  ipcMain.handle(
    'open-instruction-attachment',
    async (_event, attachmentId: number): Promise<ApiResponse<string>> => {
      try {
        const db = getDatabase()
        const idParsed = z.number().int().positive().parse(attachmentId)

        const attachment = await db<AttachmentRow>('instruction_attachments')
          .where({ id: idParsed })
          .first()

        if (!attachment) {
          return { success: false, error: 'Вложение не найдено' }
        }

        const filePath = path.join(getAttachmentsDirectory(), attachment.filename)

        if (!fs.existsSync(filePath)) {
          return { success: false, error: 'Файл не найден на диске' }
        }

        // Возвращаем путь к файлу для открытия через shell
        return { success: true, data: filePath }
      } catch (error) {
        console.error('Ошибка открытия вложения:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Не удалось открыть вложение',
        }
      }
    }
  )

  // Диалог выбора файла для вложения
  ipcMain.handle(
    'select-instruction-attachment-file',
    async (): Promise<ApiResponse<string | null>> => {
      try {
        const result = await dialog.showOpenDialog({
          title: 'Выберите файл для вложения',
          properties: ['openFile'],
          filters: [
            {
              name: 'Все файлы',
              extensions: ['*'],
            },
            {
              name: 'Документы',
              extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'],
            },
            {
              name: 'Изображения',
              extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
            },
          ],
        })

        if (result.canceled || result.filePaths.length === 0) {
          return { success: true, data: null }
        }

        return { success: true, data: result.filePaths[0] }
      } catch (error) {
        console.error('Ошибка выбора файла:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Не удалось выбрать файл',
        }
      }
    }
  )
}

// Проверка, является ли targetId потомком sourceId
async function checkIsDescendant(
  db: ReturnType<typeof getDatabase>,
  sourceId: number,
  targetId: number
): Promise<boolean> {
  if (sourceId === targetId) return true

  const children = await db<InstructionRow>('instructions')
    .where({ parent_id: sourceId })
    .select('id')

  for (const child of children) {
    if (child.id === targetId) return true
    const isDesc = await checkIsDescendant(db, child.id, targetId)
    if (isDesc) return true
  }

  return false
}

// Рекурсивное удаление
async function deleteInstructionRecursive(
  db: ReturnType<typeof getDatabase>,
  id: number
): Promise<void> {
  const children = await db<InstructionRow>('instructions').where({ parent_id: id }).select('id')

  for (const child of children) {
    await deleteInstructionRecursive(db, child.id)
  }

  await db('instructions').where({ id }).delete()
}

// Рекурсивное дублирование дочерних элементов
async function duplicateChildrenRecursive(
  db: ReturnType<typeof getDatabase>,
  originalParentId: number,
  newParentId: number,
  now: string
): Promise<void> {
  const children = await db<InstructionRow>('instructions')
    .where({ parent_id: originalParentId })
    .orderBy('sort_order', 'asc')

  for (const child of children) {
    const [newChildId] = await db('instructions').insert({
      parent_id: newParentId,
      title: child.title,
      content: child.content,
      is_folder: child.is_folder,
      is_favorite: 0,
      tags: child.tags,
      sort_order: child.sort_order,
      created_at: now,
      updated_at: now,
    })

    if (child.is_folder === 1) {
      await duplicateChildrenRecursive(db, child.id, newChildId, now)
    }
  }
}
