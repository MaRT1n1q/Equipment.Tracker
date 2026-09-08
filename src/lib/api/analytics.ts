/**
 * API-модуль для работы с аналитикой.
 * Ответ бэкенда уже в snake_case и соответствует схеме analyticsResponseSchema.
 */

import { apiGet } from '../apiClient'
import type { AnalyticsQueryParams, AnalyticsResponse } from '../../types/ipc'

export async function fetchAnalytics(params: AnalyticsQueryParams): Promise<AnalyticsResponse> {
  const qs = new URLSearchParams()
  if (params.from) qs.set('from', params.from)
  if (params.to) qs.set('to', params.to)

  return apiGet<AnalyticsResponse>(`/api/v1/analytics?${qs}`)
}
