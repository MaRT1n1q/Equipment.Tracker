/**
 * API-модуль для глобального поиска.
 */

import { apiGet } from '../apiClient'

export type GlobalSearchResultType = 'request' | 'employee_exit' | 'instruction' | 'template'

export interface GlobalSearchResult {
  type: GlobalSearchResultType
  id: number
  title: string
  subtitle: string
}

interface BackendSearchResponse {
  items: {
    type: GlobalSearchResultType
    id: number
    title: string
    subtitle: string
  }[]
}

export async function fetchGlobalSearch(query: string): Promise<GlobalSearchResult[]> {
  const qs = new URLSearchParams()
  qs.set('q', query)

  const raw = await apiGet<BackendSearchResponse>(`/api/v1/search?${qs}`)
  return raw.items.map((item) => ({
    type: item.type,
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
  }))
}
