import { ipcMain } from 'electron'
import { getDatabase } from '../database'
import {
  createTemplateSchema,
  reorderTemplatesSchema,
  updateTemplateSchema,
  type ApiResponse,
  type Template,
} from '../../src/types/ipc'
import { z } from 'zod'

export function registerTemplateHandlers() {
  ipcMain.handle('get-templates', async (): Promise<ApiResponse<Template[]>> => {
    try {
      const db = getDatabase()
      const templates = await db('templates')
        .select('id', 'title', 'content', 'created_at', 'updated_at', 'sort_order')
        .orderBy([
          { column: 'sort_order', order: 'asc' },
          { column: 'updated_at', order: 'desc' },
        ])

      return { success: true, data: templates }
    } catch (error) {
      console.error('Ошибка получения шаблонов:', error)
      return {
        success: false,
        error: 'Не удалось загрузить шаблоны',
      }
    }
  })

  ipcMain.handle(
    'create-template',
    async (_event, payload: unknown): Promise<ApiResponse<Template>> => {
      try {
        const validatedData = createTemplateSchema.parse(payload)
        const db = getDatabase()

        const now = new Date().toISOString()
        const maxOrderRow = await db('templates')
          .max<{ max: number | string }>('sort_order as max')
          .first()
        const maxOrderValue = Number(maxOrderRow?.max)
        const nextOrder = Number.isFinite(maxOrderValue) ? maxOrderValue + 1 : 0

        const [id] = await db('templates').insert({
          title: validatedData.title,
          content: validatedData.content,
          created_at: now,
          updated_at: now,
          sort_order: nextOrder,
        })

        const createdTemplate = await db('templates').where({ id }).first()

        return {
          success: true,
          data: createdTemplate,
          id,
        }
      } catch (error) {
        console.error('Ошибка создания шаблона:', error)
        if (error instanceof z.ZodError) {
          return {
            success: false,
            error: error.issues[0]?.message || 'Ошибка валидации данных',
          }
        }
        return {
          success: false,
          error: 'Не удалось создать шаблон',
        }
      }
    }
  )

  ipcMain.handle(
    'update-template',
    async (_event, id: number, payload: unknown): Promise<ApiResponse<Template>> => {
      try {
        const validatedData = updateTemplateSchema.parse(payload)
        const db = getDatabase()

        const existing = await db('templates').where({ id }).first()
        if (!existing) {
          return {
            success: false,
            error: 'Шаблон не найден',
          }
        }

        const now = new Date().toISOString()
        await db('templates').where({ id }).update({
          title: validatedData.title,
          content: validatedData.content,
          updated_at: now,
        })

        const updatedTemplate = await db('templates').where({ id }).first()

        return {
          success: true,
          data: updatedTemplate,
        }
      } catch (error) {
        console.error('Ошибка обновления шаблона:', error)
        if (error instanceof z.ZodError) {
          return {
            success: false,
            error: error.issues[0]?.message || 'Ошибка валидации данных',
          }
        }
        return {
          success: false,
          error: 'Не удалось обновить шаблон',
        }
      }
    }
  )

  ipcMain.handle('delete-template', async (_event, id: number): Promise<ApiResponse<Template>> => {
    try {
      const db = getDatabase()

      const template = await db('templates').where({ id }).first()
      if (!template) {
        return {
          success: false,
          error: 'Шаблон не найден',
        }
      }

      await db('templates').where({ id }).delete()

      const remaining = await db('templates').select('id').orderBy('sort_order', 'asc')
      await Promise.all(
        remaining.map((item, index) =>
          db('templates').where({ id: item.id }).update({ sort_order: index })
        )
      )

      return {
        success: true,
        data: template,
      }
    } catch (error) {
      console.error('Ошибка удаления шаблона:', error)
      return {
        success: false,
        error: 'Не удалось удалить шаблон',
      }
    }
  })
  ipcMain.handle('reorder-templates', async (_event, payload: unknown): Promise<ApiResponse> => {
    try {
      const { order } = reorderTemplatesSchema.parse(payload)
      const db = getDatabase()

      await db.transaction(async (trx) => {
        await Promise.all(
          order.map((id, index) => trx('templates').where({ id }).update({ sort_order: index }))
        )
      })

      return { success: true }
    } catch (error) {
      console.error('Ошибка изменения порядка шаблонов:', error)
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.issues[0]?.message || 'Ошибка валидации данных',
        }
      }
      return {
        success: false,
        error: 'Не удалось изменить порядок шаблонов',
      }
    }
  })
}
