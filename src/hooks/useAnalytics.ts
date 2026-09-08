import { useQuery } from '@tanstack/react-query'
import type { AnalyticsQueryParams, AnalyticsResponse } from '../types/ipc'
import { fetchAnalytics } from '../lib/api/analytics'

export const ANALYTICS_QUERY_KEY = ['analytics'] as const

export function useAnalyticsQuery(params: AnalyticsQueryParams) {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, params] as const,
    queryFn: (): Promise<AnalyticsResponse> => fetchAnalytics(params),
    placeholderData: (previousData) => previousData,
  })
}
