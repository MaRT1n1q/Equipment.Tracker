/**
 * API-модуль для админки.
 */

import { apiGet, apiPut, apiDelete } from '../apiClient'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  city: string
}

export interface AdminUserListParams {
  page?: number
  pageSize?: number
}

export interface AdminUserListResponse {
  items: AdminUser[]
  meta: {
    page: number
    pageSize: number
    total: number
    pageCount: number
    hasMore: boolean
  }
}

export interface AdminCityStat {
  city: string
  total: number
}

export interface AdminStats {
  requests_by_city: AdminCityStat[]
  exits_by_city: AdminCityStat[]
  users_by_city: AdminCityStat[]
}

interface BackendMeta {
  page: number
  page_size: number
  total: number
  page_count: number
  has_more: boolean
}

interface BackendUser {
  id: string
  email: string
  name: string
  role: string
  city: string
}

interface BackendUserListResponse {
  items: BackendUser[]
  meta: BackendMeta
}

export async function fetchAdminUsers(params: AdminUserListParams): Promise<AdminUserListResponse> {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.pageSize) qs.set('page_size', String(params.pageSize))

  const raw = await apiGet<BackendUserListResponse>(`/api/v1/admin/users?${qs}`)
  return {
    items: raw.items,
    meta: {
      page: raw.meta.page,
      pageSize: raw.meta.page_size,
      total: raw.meta.total,
      pageCount: raw.meta.page_count,
      hasMore: raw.meta.has_more,
    },
  }
}

export async function setAdminUserRole(userId: string, role: string): Promise<void> {
  await apiPut(`/api/v1/admin/users/${userId}/role`, { role })
}

export async function setAdminUserCity(userId: string, city: string): Promise<void> {
  await apiPut(`/api/v1/admin/users/${userId}/city`, { city })
}

export async function deleteAdminUser(userId: string): Promise<void> {
  await apiDelete(`/api/v1/admin/users/${userId}`)
}

export async function fetchAdminRegistration(): Promise<boolean> {
  const data = await apiGet<{ enabled: boolean }>(`/api/v1/admin/registration`)
  return data.enabled
}

export async function setAdminRegistration(enabled: boolean): Promise<void> {
  await apiPut(`/api/v1/admin/registration`, { enabled })
}

export async function fetchAdminStats(): Promise<AdminStats> {
  return apiGet<AdminStats>(`/api/v1/admin/stats`)
}
