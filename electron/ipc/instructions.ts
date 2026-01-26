import { ipcMain } from 'electron'
import { z } from 'zod'

import { getDatabase } from '../database'
import {
  createInstructionSchema,
  updateInstructionSchema,
  moveInstructionSchema,
  reorderInstructionsSchema,
} from '../../src/types/ipc'
import type { ApiResponse, Instruction } from '../../src/types/ipc'

interface InstructionRow {
  id: number
  parent_id: number | null
  title: string
  content: string
  sort_order: number
  is_folder: number
  created_at: string
  updated_at: string
}

function rowToInstruction(row: InstructionRow): Instruction {
  return {
    id: row.id,
    parent_id: row.parent_id,
    title: row.title,
    content: row.content,
    sort_order: row.sort_order,
    is_folder: row.is_folder,
    created_at: row.created_at,
    updated_at: row.updated_at,
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
      sort_order: child.sort_order,
      created_at: now,
      updated_at: now,
    })

    if (child.is_folder === 1) {
      await duplicateChildrenRecursive(db, child.id, newChildId, now)
    }
  }
}
