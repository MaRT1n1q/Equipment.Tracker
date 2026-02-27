import { useQuery } from '@tanstack/react-query'
import type { AuditLogListParams, PaginatedAuditLogResponse } from '../types/ipc'
import { fetchAuditLogs } from '../lib/api/auditLogs'

export const AUDIT_LOGS_QUERY_KEY = ['auditLogs'] as const

export function useAuditLogsQuery(params: AuditLogListParams) {
  return useQuery<PaginatedAuditLogResponse>({
    queryKey: [...AUDIT_LOGS_QUERY_KEY, params] as const,
    queryFn: () => fetchAuditLogs(params),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
  })
}
