/**
 * API-модуль для работы с инструкциями и их вложениями.
 */

import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  apiUpload,
  apiFetchDataUrl,
  apiFetchBlobUrl,
  downloadBlobUrl,
} from '../apiClient'
import type {
  CreateInstructionData,
  Instruction,
  InstructionAttachment,
  InstructionAttachmentPreview,
  MoveInstructionData,
  ReorderInstructionsData,
  UpdateInstructionData,
} from '../../types/ipc'

// ─── Типы бэкенда ─────────────────────────────────────────────────────────────

interface BackendInstruction {
  id: number
  parent_id: number | null
  title: string
  content: string
  sort_order: number
  is_folder: number // 0 | 1
  is_favorite: number // 0 | 1
  tags: string[]
  created_at: string
  updated_at: string
}

interface BackendAttachment {
  id: number
  instruction_id: number
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  created_at: string
}

interface BackendInstructionListResponse {
  items: BackendInstruction[]
}

interface BackendAttachmentListResponse {
  items: BackendAttachment[]
}

// ─── Маппинг ──────────────────────────────────────────────────────────────────

function mapInstruction(i: BackendInstruction): Instruction {
  return {
    id: i.id,
    parent_id: i.parent_id,
    title: i.title,
    content: i.content,
    sort_order: i.sort_order,
    is_folder: i.is_folder,
    is_favorite: i.is_favorite,
    tags: i.tags ?? [],
    created_at: i.created_at,
    updated_at: i.updated_at,
  }
}

function mapAttachment(a: BackendAttachment): InstructionAttachment {
  return {
    id: a.id,
    instruction_id: a.instruction_id,
    filename: a.filename,
    original_name: a.original_name,
    file_size: a.file_size,
    mime_type: a.mime_type,
    created_at: a.created_at,
  }
}

// ─── Инструкции ───────────────────────────────────────────────────────────────

export async function fetchInstructions(): Promise<Instruction[]> {
  const raw = await apiGet<BackendInstructionListResponse>('/api/v1/instructions')
  return raw.items.map(mapInstruction)
}

export async function fetchInstruction(id: number): Promise<Instruction> {
  const raw = await apiGet<BackendInstruction>(`/api/v1/instructions/${id}`)
  return mapInstruction(raw)
}

export async function createInstruction(data: CreateInstructionData): Promise<Instruction> {
  const body = {
    parent_id: data.parent_id ?? null,
    title: data.title,
    content: data.content ?? '',
    is_folder: data.is_folder ?? false,
    tags: data.tags ?? [],
  }
  const raw = await apiPost<BackendInstruction>('/api/v1/instructions', body)
  return mapInstruction(raw)
}

export async function updateInstruction(
  id: number,
  data: UpdateInstructionData
): Promise<Instruction> {
  const body = {
    title: data.title ?? '',
    content: data.content ?? '',
    tags: data.tags ?? [],
  }
  const raw = await apiPut<BackendInstruction>(`/api/v1/instructions/${id}`, body)
  return mapInstruction(raw)
}

export async function moveInstruction(id: number, data: MoveInstructionData): Promise<void> {
  await apiPost(`/api/v1/instructions/${id}/move`, {
    parent_id: data.parent_id,
    sort_order: data.sort_order,
  })
}

export async function reorderInstructions(data: ReorderInstructionsData): Promise<void> {
  await apiPost('/api/v1/instructions/reorder', {
    parent_id: data.parent_id,
    order: data.order,
  })
}

export async function deleteInstruction(id: number): Promise<Instruction | null> {
  // Бэкенд возвращает { deleted: id } — инструкции больше нет
  await apiDelete(`/api/v1/instructions/${id}`)
  return null
}

export async function duplicateInstruction(id: number): Promise<Instruction> {
  const raw = await apiPost<BackendInstruction>(`/api/v1/instructions/${id}/duplicate`)
  return mapInstruction(raw)
}

export async function toggleFavoriteInstruction(id: number): Promise<Instruction> {
  const raw = await apiPost<BackendInstruction>(`/api/v1/instructions/${id}/favorite-toggle`)
  return mapInstruction(raw)
}

export async function setInstructionTags(id: number, tags: string[]): Promise<void> {
  await apiPut(`/api/v1/instructions/${id}/tags`, { tags })
}

export async function fetchAllInstructionTags(): Promise<string[]> {
  const raw = await apiGet<{ tags: string[] }>('/api/v1/instructions/tags')
  return raw.tags ?? []
}

// ─── Вложения ─────────────────────────────────────────────────────────────────

export async function fetchInstructionAttachments(
  instructionId: number
): Promise<InstructionAttachment[]> {
  const raw = await apiGet<BackendAttachmentListResponse>(
    `/api/v1/instructions/${instructionId}/attachments`
  )
  return raw.items.map(mapAttachment)
}

export async function addInstructionAttachment(
  instructionId: number,
  file: File
): Promise<InstructionAttachment> {
  const raw = await apiUpload<BackendAttachmentListResponse>(
    `/api/v1/instructions/${instructionId}/attachments`,
    file
  )
  const first = raw.items[0]
  if (!first) throw new Error('Файл не был загружен')
  return mapAttachment(first)
}

export async function deleteInstructionAttachment(attachmentId: number): Promise<void> {
  await apiDelete(`/api/v1/instruction-attachments/${attachmentId}`)
}

/**
 * Возвращает превью вложения как base64 data URL.
 */
export async function getInstructionAttachmentPreview(
  attachmentId: number,
  originalName: string,
  mimeType: string
): Promise<InstructionAttachmentPreview> {
  const dataUrl = await apiFetchDataUrl(`/api/v1/instruction-attachments/${attachmentId}/preview`)
  return {
    attachment_id: attachmentId,
    original_name: originalName,
    mime_type: mimeType,
    data_url: dataUrl,
  }
}

/**
 * Скачивает вложение через браузерный диалог.
 */
export async function downloadInstructionAttachment(
  attachmentId: number,
  originalName: string
): Promise<void> {
  const blobUrl = await apiFetchBlobUrl(`/api/v1/instruction-attachments/${attachmentId}/download`)
  downloadBlobUrl(blobUrl, originalName)
}

/**
 * Открывает вложение в новой вкладке.
 */
export async function openInstructionAttachment(attachmentId: number): Promise<void> {
  const blobUrl = await apiFetchBlobUrl(`/api/v1/instruction-attachments/${attachmentId}/download`)
  window.open(blobUrl, '_blank')
}
