import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateEmployeeExitData, EmployeeExit } from '../types/ipc'

const EMPLOYEE_EXITS_QUERY_KEY = ['employeeExits'] as const

async function fetchEmployeeExits(): Promise<EmployeeExit[]> {
  const response = await window.electronAPI.getEmployeeExits()

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Не удалось загрузить записи выходов')
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

export function useEmployeeExitsQuery() {
  return useQuery({
    queryKey: EMPLOYEE_EXITS_QUERY_KEY,
    queryFn: fetchEmployeeExits,
  })
}

export function useEmployeeExitActions() {
  const queryClient = useQueryClient()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: EMPLOYEE_EXITS_QUERY_KEY })

  const createMutation = useMutation<void, Error, CreateEmployeeExitData>({
    mutationFn: async (payload) => {
      const result = await window.electronAPI.createEmployeeExit(payload)

      if (!result.success) {
        throw new Error(result.error || 'Не удалось создать запись выхода')
      }
    },
    onSuccess: invalidate,
  })

  const updateMutation = useMutation<void, Error, UpdatePayload>({
    mutationFn: async ({ id, data }) => {
      const result = await window.electronAPI.updateEmployeeExit(id, data)

      if (!result.success) {
        throw new Error(result.error || 'Не удалось обновить запись выхода')
      }
    },
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation<EmployeeExit | undefined, Error, number>({
    mutationFn: async (id) => {
      const result = await window.electronAPI.deleteEmployeeExit(id)

      if (!result.success) {
        throw new Error(result.error || 'Не удалось удалить запись выхода')
      }

      return result.data
    },
    onSuccess: invalidate,
  })

  const updateCompletedMutation = useMutation<void, Error, UpdateCompletedPayload>({
    mutationFn: async ({ id, value }) => {
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
    updateExitCompleted: updateCompletedMutation.mutateAsync,
  }
}

export { EMPLOYEE_EXITS_QUERY_KEY }
