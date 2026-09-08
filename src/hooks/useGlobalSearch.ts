import { useQuery } from '@tanstack/react-query'
import { fetchGlobalSearch, type GlobalSearchResult } from '../lib/api/search'

export const GLOBAL_SEARCH_QUERY_KEY = ['globalSearch'] as const

export function useGlobalSearchQuery(query: string) {
  const trimmed = query.trim()
  const enabled = trimmed.length >= 2

  return useQuery({
    queryKey: [...GLOBAL_SEARCH_QUERY_KEY, trimmed] as const,
    queryFn: (): Promise<GlobalSearchResult[]> => fetchGlobalSearch(trimmed),
    enabled,
  })
}
