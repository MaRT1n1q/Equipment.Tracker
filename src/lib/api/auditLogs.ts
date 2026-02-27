/**
 * API-модуль для работы с аудит-логом.
 * Конвертирует snake_case ответы бэкенда в camelCase типы фронтенда.
 */

import { apiGet } from '../apiClient'
import type { AuditLogEntry, AuditLogListParams, PaginatedAuditLogResponse } from '../../types/ipc'

// ─── Типы бэкенда (snake_case) ────────────────────────────────────────────────

interface BackendMeta {
  page: number
  page_size: number
  total: number
  page_count: number
  has_more: boolean
}

interface BackendAuditEntry {
  id: number
  entity_type: string
  entity_id: number
  action: string
  actor_id: string
  actor_login: string
  city: string
  changes: string
  created_at: string
}

interface BackendListResponse {
  items: BackendAuditEntry[]
  meta: BackendMeta
}

// ─── Маппинг ──────────────────────────────────────────────────────────────────

function mapEntry(e: BackendAuditEntry): AuditLogEntry {
  return {
    id: e.id,
    entity_type: e.entity_type as AuditLogEntry['entity_type'],
    entity_id: e.entity_id,
    action: e.action as AuditLogEntry['action'],
    actor_id: e.actor_id,
    actor_login: e.actor_login ?? '',
    city: e.city,
    changes: e.changes,
    created_at: e.created_at,
  }
}

// ─── API функции ─────────────────────────────────────────────────────────────

export async function fetchAuditLogs(
  params: AuditLogListParams
): Promise<PaginatedAuditLogResponse> {
  const qp = new URLSearchParams()
  if (params.page) qp.set('page', String(params.page))
  if (params.pageSize) qp.set('page_size', String(params.pageSize))
  if (params.entity_type) qp.set('entity_type', params.entity_type)
  if (params.entity_id) qp.set('entity_id', String(params.entity_id))

  const url = `/api/v1/audit-logs${qp.toString() ? `?${qp.toString()}` : ''}`
  const data = await apiGet<BackendListResponse>(url)

  return {
    items: data.items.map(mapEntry),
    meta: {
      page: data.meta.page,
      pageSize: data.meta.page_size,
      total: data.meta.total,
      pageCount: data.meta.page_count,
      hasMore: data.meta.has_more,
    },
  }
}
