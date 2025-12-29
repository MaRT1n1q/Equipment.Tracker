import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateRequestData,
  PaginatedRequestsResponse,
  Request,
  RequestListParams,
  RequestSummary,
  ScheduleRequestReturnData,
  UpdateRequestData,
} from '../types/ipc'

export const REQUESTS_QUERY_KEY = ['requests'] as const
export const REQUEST_SUMMARY_QUERY_KEY = ['requestSummary'] as const

// Проверка доступности API
const isApiAvailable = () => typeof window !== 'undefined' && !!window.electronAPI

async function fetchRequests(params: RequestListParams): Promise<PaginatedRequestsResponse> {
  if (!isApiAvailable()) {
    throw new Error('API не доступен')
  }
  const response = await window.electronAPI.getRequests(params)

  if (!response.success || !response.data) {
    throw new Error(
      response.error ||
        'Не удалось загрузить заявки. Попробуйте обновить данные. Если ошибка повторится, проверьте подключение или обратитесь к администратору.'
    )
  }

  return response.data
}

async function fetchRequestSummary(): Promise<RequestSummary> {
  if (!isApiAvailable()) {
    throw new Error('API не доступен')
  }
  const response = await window.electronAPI.getRequestSummary()

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Не удалось загрузить сводку заявок')
  }

  return response.data
}

type UpdatePayload = {
  id: number
  data: UpdateRequestData
}

type ToggleIssuedPayload = {
  id: number
  value: boolean
}

type ScheduleReturnPayload = {
  id: number
  data: ScheduleRequestReturnData
}

type UpdateReturnCompletionPayload = {
  id: number
  value: boolean
}

type RestorePayload = Request

export function useRequestsQuery(params: RequestListParams) {
  return useQuery({
    queryKey: [...REQUESTS_QUERY_KEY, params] as const,
    queryFn: () => fetchRequests(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useRequestSummaryQuery() {
  return useQuery({
    queryKey: REQUEST_SUMMARY_QUERY_KEY,
    queryFn: fetchRequestSummary,
    staleTime: 5 * 60 * 1000,
  })
}

export function useRequestActions() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: REQUESTS_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: REQUEST_SUMMARY_QUERY_KEY })
  }

  const createMutation = useMutation<void, Error, CreateRequestData>({
    mutationFn: async (payload) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const result = await window.electronAPI.createRequest(payload)

      if (!result.success) {
        throw new Error(result.error || 'Не удалось создать заявку')
      }
    },
    onSuccess: invalidate,
  })

  const updateMutation = useMutation<void, Error, UpdatePayload>({
    mutationFn: async ({ id, data }) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const result = await window.electronAPI.updateRequest(id, data)

      if (!result.success) {
        throw new Error(result.error || 'Не удалось обновить заявку')
      }
    },
    onSuccess: invalidate,
  })

  const toggleIssuedMutation = useMutation<void, Error, ToggleIssuedPayload>({
    mutationFn: async ({ id, value }) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const result = await window.electronAPI.updateIssued(id, value)

      if (!result.success) {
        throw new Error(result.error || 'Не удалось изменить статус заявки')
      }
    },
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation<Request, Error, number>({
    mutationFn: async (id) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const result = await window.electronAPI.deleteRequest(id)

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Не удалось удалить заявку')
      }

      return result.data
    },
    onSuccess: invalidate,
  })

  const restoreMutation = useMutation<void, Error, RestorePayload>({
    mutationFn: async (payload) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const result = await window.electronAPI.restoreRequest(payload)

      if (!result.success) {
        throw new Error(result.error || 'Не удалось восстановить заявку')
      }
    },
    onSuccess: invalidate,
  })

  const scheduleReturnMutation = useMutation<void, Error, ScheduleReturnPayload>({
    mutationFn: async ({ id, data }) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const result = await window.electronAPI.scheduleRequestReturn(id, data)

      if (!result.success) {
        throw new Error(result.error || 'Не удалось запланировать сдачу оборудования')
      }
    },
    onSuccess: invalidate,
  })

  const completeReturnMutation = useMutation<void, Error, UpdateReturnCompletionPayload>({
    mutationFn: async ({ id, value }) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const result = await window.electronAPI.completeRequestReturn(id, value)

      if (!result.success) {
        throw new Error(result.error || 'Не удалось отметить сдачу оборудования')
      }
    },
    onSuccess: invalidate,
  })

  const cancelReturnMutation = useMutation<void, Error, number>({
    mutationFn: async (id) => {
      if (!isApiAvailable()) {
        throw new Error('API не доступен')
      }
      const result = await window.electronAPI.cancelRequestReturn(id)

      if (!result.success) {
        throw new Error(result.error || 'Не удалось отменить сдачу оборудования')
      }
    },
    onSuccess: invalidate,
  })

  return {
    createRequest: createMutation.mutateAsync,
    updateRequest: updateMutation.mutateAsync,
    toggleIssued: toggleIssuedMutation.mutateAsync,
    deleteRequest: deleteMutation.mutateAsync,
    restoreRequest: restoreMutation.mutateAsync,
    scheduleReturn: scheduleReturnMutation.mutateAsync,
    completeReturn: completeReturnMutation.mutateAsync,
    cancelReturn: cancelReturnMutation.mutateAsync,
  }
}
