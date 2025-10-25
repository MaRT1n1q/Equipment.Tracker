import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateRequestData, Request, UpdateRequestData } from '../types/ipc'

const REQUESTS_QUERY_KEY = ['requests'] as const

async function fetchRequests(): Promise<Request[]> {
  const response = await window.electronAPI.getRequests()

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Не удалось загрузить заявки')
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

type RestorePayload = Request

export function useRequestsQuery() {
  return useQuery({
    queryKey: REQUESTS_QUERY_KEY,
    queryFn: fetchRequests,
  })
}

export function useRequestActions() {
  const queryClient = useQueryClient()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: REQUESTS_QUERY_KEY })

  const createMutation = useMutation<void, Error, CreateRequestData>({
    mutationFn: async (payload) => {
      const result = await window.electronAPI.createRequest(payload)

      if (!result.success) {
        throw new Error(result.error || 'Не удалось создать заявку')
      }
    },
    onSuccess: invalidate,
  })

  const updateMutation = useMutation<void, Error, UpdatePayload>({
    mutationFn: async ({ id, data }) => {
      const result = await window.electronAPI.updateRequest(id, data)

      if (!result.success) {
        throw new Error(result.error || 'Не удалось обновить заявку')
      }
    },
    onSuccess: invalidate,
  })

  const toggleIssuedMutation = useMutation<void, Error, ToggleIssuedPayload>({
    mutationFn: async ({ id, value }) => {
      const result = await window.electronAPI.updateIssued(id, value)

      if (!result.success) {
        throw new Error(result.error || 'Не удалось изменить статус заявки')
      }
    },
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation<Request, Error, number>({
    mutationFn: async (id) => {
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
      const result = await window.electronAPI.restoreRequest(payload)

      if (!result.success) {
        throw new Error(result.error || 'Не удалось восстановить заявку')
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
  }
}

export { REQUESTS_QUERY_KEY }
