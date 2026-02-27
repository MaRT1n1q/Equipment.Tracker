import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateEmployeeExitData,
  EmployeeExit,
  EmployeeExitListParams,
  EmployeeExitSummary,
  PaginatedEmployeeExitsResponse,
} from '../types/ipc'
import {
  fetchEmployeeExits,
  fetchEmployeeExitSummary,
  createEmployeeExit,
  updateEmployeeExit,
  deleteEmployeeExit,
  restoreEmployeeExit,
  setExitCompleted,
  updateExitEquipmentStatus,
} from '../lib/api/employeeExits'
import { broadcastInvalidation } from '../lib/querySync'

export const EMPLOYEE_EXITS_QUERY_KEY = ['employeeExits'] as const
export const EMPLOYEE_EXIT_SUMMARY_QUERY_KEY = ['employeeExitSummary'] as const

type UpdatePayload = {
  id: number
  data: CreateEmployeeExitData
}

type UpdateCompletedPayload = {
  id: number
  value: boolean
}

type UpdateEquipmentStatusPayload = {
  exitId: number
  equipmentIndex: number
  status: string
}

export function useEmployeeExitsQuery(params: EmployeeExitListParams) {
  return useQuery({
    queryKey: [...EMPLOYEE_EXITS_QUERY_KEY, params] as const,
    queryFn: (): Promise<PaginatedEmployeeExitsResponse> => fetchEmployeeExits(params),
    placeholderData: (previousData) => previousData,
    staleTime: 0,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  })
}

export function useEmployeeExitSummaryQuery() {
  return useQuery({
    queryKey: [...EMPLOYEE_EXIT_SUMMARY_QUERY_KEY] as const,
    queryFn: (): Promise<EmployeeExitSummary> => fetchEmployeeExitSummary(),
    staleTime: 0,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  })
}

export function useEmployeeExitActions() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: EMPLOYEE_EXITS_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: EMPLOYEE_EXIT_SUMMARY_QUERY_KEY })
    broadcastInvalidation(['employeeExits', 'employeeExitSummary'])
  }

  const createMutation = useMutation<void, Error, CreateEmployeeExitData>({
    mutationFn: async (payload) => {
      await createEmployeeExit(payload)
    },
    onSuccess: invalidate,
  })

  const updateMutation = useMutation<void, Error, UpdatePayload>({
    mutationFn: async ({ id, data }) => {
      await updateEmployeeExit(id, data)
    },
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation<EmployeeExit, Error, number>({
    mutationFn: async (id) => {
      return deleteEmployeeExit(id)
    },
    onSuccess: invalidate,
  })

  const restoreMutation = useMutation<void, Error, EmployeeExit>({
    mutationFn: async (payload) => {
      await restoreEmployeeExit(payload)
    },
    onSuccess: invalidate,
  })

  const updateCompletedMutation = useMutation<void, Error, UpdateCompletedPayload>({
    mutationFn: async ({ id, value }) => {
      await setExitCompleted(id, value)
    },
    onSuccess: invalidate,
  })

  const updateEquipmentStatusMutation = useMutation<void, Error, UpdateEquipmentStatusPayload>({
    mutationFn: async ({ exitId, equipmentIndex, status }) => {
      await updateExitEquipmentStatus(exitId, equipmentIndex, status)
    },
    onSuccess: invalidate,
  })

  return {
    createEmployeeExit: createMutation.mutateAsync,
    updateEmployeeExit: updateMutation.mutateAsync,
    deleteEmployeeExit: deleteMutation.mutateAsync,
    restoreEmployeeExit: restoreMutation.mutateAsync,
    updateExitCompleted: updateCompletedMutation.mutateAsync,
    updateExitEquipmentStatus: updateEquipmentStatusMutation.mutateAsync,
  }
}
