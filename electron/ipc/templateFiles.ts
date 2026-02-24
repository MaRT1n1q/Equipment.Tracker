import { ipcMain, dialog, shell } from 'electron'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { getDatabase, ensureTemplateFilesDirectory, getTemplateFilesDirectory } from '../database'
import type { ApiResponse, TemplateFilePreview } from '../../src/types/ipc'

export interface TemplateFile {
  id: number
  template_id: number
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  created_at: string
}

export function registerTemplateFileHandlers() {
  // Получить список файлов шаблона
  ipcMain.handle(
    'get-template-files',
    async (_event, templateId: number): Promise<ApiResponse<TemplateFile[]>> => {
      try {
        const db = getDatabase()
        const files = await db('template_files')
          .where({ template_id: templateId })
          .select(
            'id',
            'template_id',
            'filename',
            'original_name',
            'file_size',
            'mime_type',
            'created_at'
          )
          .orderBy('created_at', 'desc')

        return { success: true, data: files }
      } catch (error) {
        console.error('Ошибка получения файлов шаблона:', error)
        return {
          success: false,
          error: 'Не удалось загрузить файлы',
        }
      }
    }
  )

  // Выбрать и загрузить файлы через диалог
  ipcMain.handle(
    'upload-template-files-dialog',
    async (_event, templateId: number): Promise<ApiResponse<TemplateFile[]>> => {
      try {
        const result = await dialog.showOpenDialog({
          properties: ['openFile', 'multiSelections'],
          title: 'Выберите файлы для прикрепления',
        })

        if (result.canceled || result.filePaths.length === 0) {
          return { success: true, data: [] }
        }

        const db = getDatabase()
        const filesDir = ensureTemplateFilesDirectory()
        const now = new Date().toISOString()
        const uploadedFiles: TemplateFile[] = []

        for (const filePath of result.filePaths) {
          try {
            const stats = fs.statSync(filePath)
            const originalName = path.basename(filePath)
            const ext = path.extname(originalName)
            const uniqueFilename = `${templateId}_${crypto.randomUUID()}${ext}`
            const destPath = path.join(filesDir, uniqueFilename)

            // Копируем файл
            fs.copyFileSync(filePath, destPath)

            // Определяем MIME тип по расширению
            const mimeType = getMimeType(ext)

            // Сохраняем запись в БД
            const [id] = await db('template_files').insert({
              template_id: templateId,
              filename: uniqueFilename,
              original_name: originalName,
              file_size: stats.size,
              mime_type: mimeType,
              created_at: now,
            })

            const createdFile = await db('template_files').where({ id }).first()
            if (createdFile) {
              uploadedFiles.push(createdFile)
            }
          } catch (fileError) {
            console.error(`Ошибка загрузки файла ${filePath}:`, fileError)
            // Продолжаем с остальными файлами
          }
        }

        return { success: true, data: uploadedFiles }
      } catch (error) {
        console.error('Ошибка загрузки файлов:', error)
        return {
          success: false,
          error: 'Не удалось загрузить файлы',
        }
      }
    }
  )

  // Скачать файл (открыть диалог сохранения)
  ipcMain.handle(
    'download-template-file',
    async (_event, fileId: number): Promise<ApiResponse<{ path: string }>> => {
      try {
        const db = getDatabase()
        const file = await db('template_files').where({ id: fileId }).first()

        if (!file) {
          return {
            success: false,
            error: 'Файл не найден',
          }
        }

        const filesDir = getTemplateFilesDirectory()
        const sourcePath = path.join(filesDir, file.filename)

        if (!fs.existsSync(sourcePath)) {
          return {
            success: false,
            error: 'Файл не найден на диске',
          }
        }

        const result = await dialog.showSaveDialog({
          title: 'Сохранить файл',
          defaultPath: file.original_name,
        })

        if (result.canceled || !result.filePath) {
          return { success: true, data: { path: '' } }
        }

        fs.copyFileSync(sourcePath, result.filePath)

        return { success: true, data: { path: result.filePath } }
      } catch (error) {
        console.error('Ошибка скачивания файла:', error)
        return {
          success: false,
          error: 'Не удалось скачать файл',
        }
      }
    }
  )

  // Открыть файл в системном приложении
  ipcMain.handle('open-template-file', async (_event, fileId: number): Promise<ApiResponse> => {
    try {
      const db = getDatabase()
      const file = await db('template_files').where({ id: fileId }).first()

      if (!file) {
        return {
          success: false,
          error: 'Файл не найден',
        }
      }

      const filesDir = getTemplateFilesDirectory()
      const filePath = path.join(filesDir, file.filename)

      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: 'Файл не найден на диске',
        }
      }

      await shell.openPath(filePath)
      return { success: true }
    } catch (error) {
      console.error('Ошибка открытия файла:', error)
      return {
        success: false,
        error: 'Не удалось открыть файл',
      }
    }
  })

  // Удалить файл
  ipcMain.handle(
    'delete-template-file',
    async (_event, fileId: number): Promise<ApiResponse<TemplateFile>> => {
      try {
        const db = getDatabase()
        const file = await db('template_files').where({ id: fileId }).first()

        if (!file) {
          return {
            success: false,
            error: 'Файл не найден',
          }
        }

        // Удаляем файл с диска
        const filesDir = getTemplateFilesDirectory()
        const filePath = path.join(filesDir, file.filename)

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }

        // Удаляем запись из БД
        await db('template_files').where({ id: fileId }).delete()

        return { success: true, data: file }
      } catch (error) {
        console.error('Ошибка удаления файла:', error)
        return {
          success: false,
          error: 'Не удалось удалить файл',
        }
      }
    }
  )

  ipcMain.handle(
    'get-template-file-preview',
    async (_event, fileId: number): Promise<ApiResponse<TemplateFilePreview>> => {
      try {
        const db = getDatabase()
        const file = await db('template_files').where({ id: fileId }).first()

        if (!file) {
          return {
            success: false,
            error: 'Файл не найден',
          }
        }

        if (!String(file.mime_type).startsWith('image/')) {
          return {
            success: false,
            error: 'Предпросмотр доступен только для изображений',
          }
        }

        const filesDir = getTemplateFilesDirectory()
        const filePath = path.join(filesDir, file.filename)

        if (!fs.existsSync(filePath)) {
          return {
            success: false,
            error: 'Файл не найден на диске',
          }
        }

        const buffer = fs.readFileSync(filePath)
        const mimeType = String(file.mime_type)

        return {
          success: true,
          data: {
            file_id: file.id,
            original_name: file.original_name,
            mime_type: mimeType,
            data_url: `data:${mimeType};base64,${buffer.toString('base64')}`,
          },
        }
      } catch (error) {
        console.error('Ошибка предпросмотра файла шаблона:', error)
        return {
          success: false,
          error: 'Не удалось получить предпросмотр файла',
        }
      }
    }
  )

  // Получить количество файлов для всех шаблонов
  ipcMain.handle(
    'get-template-file-counts',
    async (): Promise<ApiResponse<Record<number, number>>> => {
      try {
        const db = getDatabase()
        const counts = await db('template_files')
          .select('template_id')
          .count('id as count')
          .groupBy('template_id')

        const result: Record<number, number> = {}
        for (const row of counts) {
          const templateId = row.template_id as number
          result[templateId] = Number(row.count)
        }

        return { success: true, data: result }
      } catch (error) {
        console.error('Ошибка получения количества файлов:', error)
        return {
          success: false,
          error: 'Не удалось получить данные',
        }
      }
    }
  )

  // Загрузить файлы по путям (для drag-and-drop)
  ipcMain.handle(
    'upload-template-files-by-paths',
    async (
      _event,
      templateId: number,
      filePaths: string[]
    ): Promise<ApiResponse<TemplateFile[]>> => {
      try {
        if (!filePaths || filePaths.length === 0) {
          return { success: true, data: [] }
        }

        const db = getDatabase()
        const filesDir = ensureTemplateFilesDirectory()
        const now = new Date().toISOString()
        const uploadedFiles: TemplateFile[] = []

        for (const filePath of filePaths) {
          try {
            if (!fs.existsSync(filePath)) {
              console.error(`Файл не существует: ${filePath}`)
              continue
            }

            const stats = fs.statSync(filePath)
            const originalName = path.basename(filePath)
            const ext = path.extname(originalName)
            const uniqueFilename = `${templateId}_${crypto.randomUUID()}${ext}`
            const destPath = path.join(filesDir, uniqueFilename)

            // Копируем файл
            fs.copyFileSync(filePath, destPath)

            // Определяем MIME тип
            const mimeType = getMimeType(ext)

            // Сохраняем запись в БД
            const [id] = await db('template_files').insert({
              template_id: templateId,
              filename: uniqueFilename,
              original_name: originalName,
              file_size: stats.size,
              mime_type: mimeType,
              created_at: now,
            })

            const createdFile = await db('template_files').where({ id }).first()
            if (createdFile) {
              uploadedFiles.push(createdFile)
            }
          } catch (fileError) {
            console.error(`Ошибка загрузки файла ${filePath}:`, fileError)
          }
        }

        return { success: true, data: uploadedFiles }
      } catch (error) {
        console.error('Ошибка загрузки файлов:', error)
        return {
          success: false,
          error: 'Не удалось загрузить файлы',
        }
      }
    }
  )
}

function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    // Документы
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.rtf': 'application/rtf',
    '.csv': 'text/csv',
    // Изображения
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    // Архивы
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    // Аудио/Видео
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
    // Код
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
  }

  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream'
}
