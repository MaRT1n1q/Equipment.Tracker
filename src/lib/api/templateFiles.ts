/**
 * API-модуль для работы с файлами шаблонов.
 * Preview-эндпоинт (бинарное изображение) конвертируется в base64 data URL.
 */

import {
  apiDelete,
  apiGet,
  apiUpload,
  apiFetchDataUrl,
  apiFetchBlobUrl,
  downloadBlobUrl,
} from '../apiClient'
import type { TemplateFile, TemplateFilePreview } from '../../types/ipc'

// ─── Типы бэкенда ─────────────────────────────────────────────────────────────

interface BackendTemplateFile {
  id: number
  template_id: number
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  created_at: string
}

interface BackendFileListResponse {
  items: BackendTemplateFile[]
}

interface BackendCountsResponse {
  [templateId: string]: number
}

// ─── Маппинг ──────────────────────────────────────────────────────────────────

function mapTemplateFile(f: BackendTemplateFile): TemplateFile {
  return {
    id: f.id,
    template_id: f.template_id,
    filename: f.filename,
    original_name: f.original_name,
    file_size: f.file_size,
    mime_type: f.mime_type,
    created_at: f.created_at,
  }
}

// ─── API-функции ──────────────────────────────────────────────────────────────

export async function fetchTemplateFiles(templateId: number): Promise<TemplateFile[]> {
  const raw = await apiGet<BackendFileListResponse>(`/api/v1/templates/${templateId}/files`)
  return raw.items.map(mapTemplateFile)
}

export async function uploadTemplateFiles(
  templateId: number,
  files: File[]
): Promise<TemplateFile[]> {
  const raw = await apiUpload<BackendFileListResponse>(
    `/api/v1/templates/${templateId}/files`,
    files
  )
  return raw.items.map(mapTemplateFile)
}

export async function getTemplateFileMeta(fileId: number): Promise<TemplateFile> {
  const raw = await apiGet<BackendTemplateFile>(`/api/v1/template-files/${fileId}`)
  return mapTemplateFile(raw)
}

/**
 * Скачивает файл через браузерный диалог сохранения.
 */
export async function downloadTemplateFile(fileId: number, originalName: string): Promise<void> {
  const blobUrl = await apiFetchBlobUrl(`/api/v1/template-files/${fileId}/download`)
  downloadBlobUrl(blobUrl, originalName)
}

/**
 * Открывает файл в новой вкладке (аналог "открыть с помощью системы").
 */
export async function openTemplateFile(fileId: number): Promise<void> {
  const blobUrl = await apiFetchBlobUrl(`/api/v1/template-files/${fileId}/download`)
  window.open(blobUrl, '_blank')
  // blob URL остаётся в памяти — приемлемо для короткоживущей вкладки
}

/**
 * Возвращает превью изображения как base64 data URL.
 */
export async function getTemplateFilePreview(
  fileId: number,
  originalName: string,
  mimeType: string
): Promise<TemplateFilePreview> {
  const dataUrl = await apiFetchDataUrl(`/api/v1/template-files/${fileId}/preview`)
  return {
    file_id: fileId,
    original_name: originalName,
    mime_type: mimeType,
    data_url: dataUrl,
  }
}

export async function deleteTemplateFile(fileId: number): Promise<void> {
  await apiDelete(`/api/v1/template-files/${fileId}`)
}

export async function fetchTemplateFileCounts(): Promise<Record<number, number>> {
  const raw = await apiGet<BackendCountsResponse>('/api/v1/template-files/counts')
  const result: Record<number, number> = {}
  for (const [key, value] of Object.entries(raw)) {
    result[Number(key)] = value
  }
  return result
}
