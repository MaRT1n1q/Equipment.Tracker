/**
 * API-модуль для работы с шаблонами заявок.
 */

import { apiDelete, apiGet, apiPost, apiPut } from '../apiClient'
import type { CreateTemplateData, Template, UpdateTemplateData } from '../../types/ipc'

// ─── Типы бэкенда ─────────────────────────────────────────────────────────────

interface BackendTemplate {
  id: number
  title: string
  content: string
  sort_order: number
  created_at: string
  updated_at: string
}

interface BackendTemplateListResponse {
  items: BackendTemplate[]
}

// ─── Маппинг ──────────────────────────────────────────────────────────────────

function mapTemplate(t: BackendTemplate): Template {
  return {
    id: t.id,
    title: t.title,
    content: t.content,
    sort_order: t.sort_order,
    created_at: t.created_at,
    updated_at: t.updated_at,
  }
}

// ─── API-функции ──────────────────────────────────────────────────────────────

export async function fetchTemplates(): Promise<Template[]> {
  const raw = await apiGet<BackendTemplate[] | BackendTemplateListResponse>('/api/v1/templates')
  const items = Array.isArray(raw) ? raw : (raw.items ?? [])
  return items.map(mapTemplate)
}

export async function createTemplate(data: CreateTemplateData): Promise<{ id: number }> {
  return apiPost<{ id: number }>('/api/v1/templates', data)
}

export async function updateTemplate(id: number, data: UpdateTemplateData): Promise<void> {
  await apiPut(`/api/v1/templates/${id}`, data)
}

export async function deleteTemplate(id: number): Promise<void> {
  await apiDelete(`/api/v1/templates/${id}`)
}

export async function reorderTemplates(order: number[]): Promise<void> {
  await apiPost('/api/v1/templates/reorder', { order })
}
