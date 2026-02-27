/**
 * API-модуль для работы с выходами сотрудников.
 */

import { apiDelete, apiGet, apiPost, apiPut } from '../apiClient'
import type {
  CreateEmployeeExitData,
  EmployeeExit,
  EmployeeExitListParams,
  EmployeeExitSummary,
  PaginatedEmployeeExitsResponse,
} from '../../types/ipc'

// ─── Типы бэкенда ─────────────────────────────────────────────────────────────

interface BackendMeta {
  page: number
  page_size: number
  total: number
  page_count: number
  has_more: boolean
}

interface BackendExit {
  id: number
  employee_name: string
  login: string
  sd_number: string | null
  delivery_url: string | null
  exit_date: string | null
  equipment_list: string
  is_completed: boolean
  completed_at: string | null
  notes: string | null
  created_at: string
}

interface BackendExitListResponse {
  items: BackendExit[]
  meta: BackendMeta
}

interface BackendSummary {
  totals: {
    total: number
    completed: number
    pending: number
  }
  exits: BackendExit[]
}

// ─── Маппинг ──────────────────────────────────────────────────────────────────

function mapMeta(m: BackendMeta): PaginatedEmployeeExitsResponse['meta'] {
  return {
    page: m.page,
    pageSize: m.page_size,
    total: m.total,
    pageCount: m.page_count,
    hasMore: m.has_more,
  }
}

function mapExit(e: BackendExit): EmployeeExit {
  return {
    id: e.id,
    employee_name: e.employee_name,
    login: e.login,
    sd_number: e.sd_number,
    delivery_url: e.delivery_url,
    exit_date: e.exit_date ?? '',
    equipment_list: e.equipment_list,
    is_completed: e.is_completed ? 1 : 0,
    created_at: e.created_at,
  }
}

function mapSummary(s: BackendSummary): EmployeeExitSummary {
  return {
    totals: {
      total: s.totals.total,
      completed: s.totals.completed,
      pending: s.totals.pending,
    },
    exits: s.exits.map(mapExit),
  }
}

function toRestoreBody(payload: EmployeeExit) {
  return {
    employee_name: payload.employee_name,
    login: payload.login,
    sd_number: payload.sd_number ?? '',
    delivery_url: payload.delivery_url ?? '',
    exit_date: payload.exit_date || null,
    equipment_list: payload.equipment_list,
    notes: null,
  }
}

// ─── API-функции ──────────────────────────────────────────────────────────────

export async function fetchEmployeeExits(
  params: EmployeeExitListParams
): Promise<PaginatedEmployeeExitsResponse> {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.pageSize) qs.set('page_size', String(params.pageSize))
  if (params.search) qs.set('search', params.search)
  if (params.status) qs.set('status', params.status)

  const raw = await apiGet<BackendExitListResponse>(`/api/v1/employee-exits?${qs}`)
  return {
    items: raw.items.map(mapExit),
    meta: mapMeta(raw.meta),
  }
}

export async function fetchEmployeeExitSummary(): Promise<EmployeeExitSummary> {
  const raw = await apiGet<BackendSummary>(`/api/v1/employee-exits/summary`)
  return mapSummary(raw)
}

export async function createEmployeeExit(data: CreateEmployeeExitData): Promise<void> {
  await apiPost('/api/v1/employee-exits', data)
}

export async function updateEmployeeExit(id: number, data: CreateEmployeeExitData): Promise<void> {
  await apiPut(`/api/v1/employee-exits/${id}`, data)
}

export async function deleteEmployeeExit(id: number): Promise<EmployeeExit> {
  const raw = await apiDelete<{ deleted: BackendExit | { id: number } }>(
    `/api/v1/employee-exits/${id}`
  )
  if (raw.deleted && 'employee_name' in raw.deleted) {
    return mapExit(raw.deleted as BackendExit)
  }
  const deletedId = (raw.deleted as { id: number }).id ?? id
  return {
    id: deletedId,
    employee_name: '',
    login: '',
    sd_number: null,
    delivery_url: null,
    exit_date: '',
    equipment_list: '',
    is_completed: 0,
    created_at: '',
  }
}

export async function restoreEmployeeExit(payload: EmployeeExit): Promise<void> {
  await apiPost(`/api/v1/employee-exits/${payload.id}/restore`, toRestoreBody(payload))
}

export async function setExitCompleted(id: number, value: boolean): Promise<void> {
  await apiPost(`/api/v1/employee-exits/${id}/completed`, { is_completed: value })
}

export async function updateExitEquipmentStatus(
  exitId: number,
  equipmentIndex: number,
  status: string
): Promise<void> {
  await apiPost(`/api/v1/employee-exits/${exitId}/equipment-status`, {
    equipment_index: equipmentIndex,
    status,
  })
}
