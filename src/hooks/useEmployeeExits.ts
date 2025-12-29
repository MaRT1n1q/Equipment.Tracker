import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateEmployeeExitData,
  EmployeeExit,
  EmployeeExitListParams,
  EmployeeExitSummary,
  PaginatedEmployeeExitsResponse,
} from '../types/ipc'

export const EMPLOYEE_EXITS_QUERY_KEY = ['employeeExits'] as const
export const EMPLOYEE_EXIT_SUMMARY_QUERY_KEY = ['employeeExitSummary'] as const

// Проверка доступности API
const isApiAvailable = () => typeof window !== 'undefined' && !!window.electronAPI

async function fetchEmployeeExits(
  params: EmployeeExitListParams
): Promise<PaginatedEmployeeExitsResponse> {
  if (!isApiAvailable()) {
    throw new Error('API не доступен')
  }
  const response = await window.electronAPI.getEmployeeExits(params)

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Не удалось загрузить записи выходов')
  }

  return response.data
}

async function fetchEmployeeExitSummary(): Promise<EmployeeExitSummary> {
  if (!isApiAvailable()) {
    throw new Error('API не доступен')
  }
  const response = await window.electronAPI.getEmployeeExitSummary()

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Не удалось загрузить сводку выходов')
  }

  return response.data
}

type UpdatePayload = {
  id: number
  data: CreateEmployeeExitData
}

type UpdateCompletedPayload = {
  id: number
  value: boolean
}

export function useEmployeeExitsQuery(params: EmployeeExitListParams) {
  return useQuery({
    queryKey: [...EMPLOYEE_EXITS_QUERY_KEY, params] as const,
    queryFn: () => fetchEmployeeExits(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useEmployeeExitSummaryQuery() {
  return useQuery({
    queryKey: EMPLOYEE_EXIT_SUMMARY_QUERY_KEY,
    queryFn: fetchEmployeeExitSummary,
    staleTime: 5 * 60 * 1000,
  })
}

export function useEmployeeExitActions() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: EMPLOYEE_EXITS_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: EMPLOYEE_EXIT_SUMMARY_QUERY_KEY })
  }

  const createMutation = useMutation<void, Error, CreateEmployeeExitData>({
    mutationFn: async (payload) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const result = await window.electronAPI.createEmployeeExit(payload)

      if (!result.success) {
        throw new Error(result.error || 'Не удалось создать запись выхода')
      }
    },
    onSuccess: invalidate,
  })

  const updateMutation = useMutation<void, Error, UpdatePayload>({
    mutationFn: async ({ id, data }) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const result = await window.electronAPI.updateEmployeeExit(id, data)

      if (!result.success) {
        throw new Error(result.error || 'Не удалось обновить запись выхода')
      }
    },
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation<EmployeeExit, Error, number>({
    mutationFn: async (id) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const result = await window.electronAPI.deleteEmployeeExit(id)

      if (!result.success) {
        throw new Error(result.error || 'Не удалось удалить запись выхода')
      }

      if (!result.data) {
        throw new Error('Не удалось получить данные удалённой записи')
      }

      return result.data
    },
    onSuccess: invalidate,
  })

  const restoreMutation = useMutation<void, Error, EmployeeExit>({
    mutationFn: async (payload) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const result = await window.electronAPI.restoreEmployeeExit(payload)

      if (!result.success) {
        throw new Error(result.error || 'Не удалось восстановить запись выхода')
      }
    },
    onSuccess: invalidate,
  })

  const updateCompletedMutation = useMutation<void, Error, UpdateCompletedPayload>({
    mutationFn: async ({ id, value }) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const result = await window.electronAPI.updateExitCompleted(id, value)

      if (!result.success) {
        throw new Error(result.error || 'Не удалось изменить статус выдачи')
      }
    },
    onSuccess: invalidate,
  })

  return {
    createEmployeeExit: createMutation.mutateAsync,
    updateEmployeeExit: updateMutation.mutateAsync,
    deleteEmployeeExit: deleteMutation.mutateAsync,
    restoreEmployeeExit: restoreMutation.mutateAsync,
    updateExitCompleted: updateCompletedMutation.mutateAsync,
  }
}
