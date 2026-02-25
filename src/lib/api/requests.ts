/**
 * API-модуль для работы с заявками на оборудование.
 * Конвертирует snake_case ответы бэкенда в camelCase типы фронтенда.
 */

import { apiDelete, apiGet, apiPost, apiPut } from '../apiClient'
import type {
  CreateRequestData,
  PaginatedRequestsResponse,
  Request,
  RequestListParams,
  RequestSummary,
  ScheduleRequestReturnData,
  UpdateRequestData,
} from '../../types/ipc'

// ─── Типы бэкенда (snake_case) ────────────────────────────────────────────────

interface BackendMeta {
  page: number
  page_size: number
  total: number
  page_count: number
  has_more: boolean
}

interface BackendEquipmentItem {
  id: number
  equipment_name: string
  serial_number: string
  quantity: number
  status: string
}

interface BackendRequest {
  id: number
  employee_name: string
  login: string
  sd_number: string | null
  delivery_url: string | null
  notes: string | null
  is_issued: boolean
  issued_at: string | null
  return_required: boolean
  return_due_date: string | null
  return_equipment: string | null
  return_completed: boolean
  return_completed_at: string | null
  return_scheduled_at: string | null
  created_at: string
  equipment_items: BackendEquipmentItem[]
}

interface BackendListResponse {
  items: BackendRequest[]
  meta: BackendMeta
}

interface BackendReturnEvent {
  request_id: number
  employee_name: string
  due_date: string
  equipment: string
}

interface BackendSummary {
  totals: {
    total: number
    issued: number
    not_issued: number
    return_pending: number
    return_completed: number
    this_month: number
  }
  return_events: BackendReturnEvent[]
}

// ─── Маппинг ──────────────────────────────────────────────────────────────────

function mapMeta(m: BackendMeta): PaginatedRequestsResponse['meta'] {
  return {
    page: m.page,
    pageSize: m.page_size,
    total: m.total,
    pageCount: m.page_count,
    hasMore: m.has_more,
  }
}

function mapRequest(r: BackendRequest): Request {
  return {
    id: r.id,
    employee_name: r.employee_name,
    login: r.login,
    sd_number: r.sd_number,
    delivery_url: r.delivery_url,
    notes: r.notes,
    created_at: r.created_at,
    is_issued: r.is_issued ? 1 : 0,
    issued_at: r.issued_at,
    return_required: r.return_required ? 1 : 0,
    return_due_date: r.return_due_date,
    return_equipment: r.return_equipment,
    return_completed: r.return_completed ? 1 : 0,
    return_completed_at: r.return_completed_at,
    return_scheduled_at: r.return_scheduled_at,
    equipment_items: r.equipment_items.map((item) => ({
      id: item.id,
      equipment_name: item.equipment_name,
      serial_number: item.serial_number,
      quantity: item.quantity,
      status: item.status as Request['equipment_items'][number]['status'],
    })),
  }
}

function mapSummary(s: BackendSummary): RequestSummary {
  return {
    totals: {
      total: s.totals.total,
      issued: s.totals.issued,
      notIssued: s.totals.not_issued,
      returnPending: s.totals.return_pending,
      returnCompleted: s.totals.return_completed,
      thisMonth: s.totals.this_month,
    },
    returnEvents: s.return_events.map((e) => ({
      id: e.request_id,
      employee_name: e.employee_name,
      login: '',
      sd_number: null,
      return_due_date: e.due_date,
      return_equipment: e.equipment,
      return_completed: 0,
    })),
  }
}

// ─── Вспомогательная функция для тела restore ────────────────────────────────

function toRestoreBody(payload: Request) {
  return {
    employee_name: payload.employee_name,
    login: payload.login,
    sd_number: payload.sd_number ?? '',
    delivery_url: payload.delivery_url ?? '',
    notes: payload.notes,
    return_required: payload.return_required === 1,
    equipment_items: payload.equipment_items,
  }
}

// ─── API-функции ──────────────────────────────────────────────────────────────

export async function fetchRequests(params: RequestListParams): Promise<PaginatedRequestsResponse> {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.pageSize) qs.set('page_size', String(params.pageSize))
  if (params.search) qs.set('search', params.search)
  if (params.status) qs.set('status', params.status)

  const raw = await apiGet<BackendListResponse>(`/api/v1/requests?${qs}`)
  return {
    items: raw.items.map(mapRequest),
    meta: mapMeta(raw.meta),
  }
}

export async function fetchRequestSummary(): Promise<RequestSummary> {
  const raw = await apiGet<BackendSummary>('/api/v1/requests/summary')
  return mapSummary(raw)
}

export async function createRequest(data: CreateRequestData): Promise<void> {
  await apiPost('/api/v1/requests', data)
}

export async function updateRequest(id: number, data: UpdateRequestData): Promise<void> {
  await apiPut(`/api/v1/requests/${id}`, data)
}

export async function deleteRequest(id: number): Promise<Request> {
  // Бэкенд возвращает { deleted: { id } } — нам нужно вернуть Request, но у нас только id.
  // Заявка уже есть в кэше — invalidate достаточно. Возвращаем минимальный объект.
  const raw = await apiDelete<{ deleted: BackendRequest }>(`/api/v1/requests/${id}`)
  // Если бэкенд вернул только id = {deleted: {id: N}} — не полный объект
  if (raw.deleted && typeof raw.deleted === 'object' && 'employee_name' in raw.deleted) {
    return mapRequest(raw.deleted)
  }
  // Бэкенд возвращает { deleted: { id } } — синтетически возвращаем заглушку с id
  const deletedId = (raw.deleted as unknown as { id: number }).id ?? id
  return {
    id: deletedId,
    employee_name: '',
    login: '',
    sd_number: null,
    delivery_url: null,
    notes: null,
    created_at: '',
    is_issued: 0,
    issued_at: null,
    return_required: 0,
    return_due_date: null,
    return_equipment: null,
    return_completed: 0,
    return_completed_at: null,
    return_scheduled_at: null,
    equipment_items: [],
  }
}

export async function restoreRequest(payload: Request): Promise<void> {
  await apiPost(`/api/v1/requests/${payload.id}/restore`, toRestoreBody(payload))
}

export async function setIssued(id: number, value: boolean): Promise<void> {
  await apiPost(`/api/v1/requests/${id}/issued`, { is_issued: value })
}

export async function scheduleReturn(id: number, data: ScheduleRequestReturnData): Promise<void> {
  await apiPost(`/api/v1/requests/${id}/return/schedule`, data)
}

export async function completeReturn(id: number): Promise<void> {
  await apiPost(`/api/v1/requests/${id}/return/complete`)
}

export async function cancelReturn(id: number): Promise<void> {
  await apiPost(`/api/v1/requests/${id}/return/cancel`)
}

export async function updateEquipmentItemStatus(itemId: number, status: string): Promise<void> {
  await apiPost(`/api/v1/equipment-items/${itemId}/status`, { status })
}
