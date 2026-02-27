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
import {
  fetchRequests,
  fetchRequestSummary,
  createRequest,
  updateRequest,
  deleteRequest,
  restoreRequest,
  setIssued,
  scheduleReturn,
  completeReturn,
  cancelReturn,
  updateEquipmentItemStatus,
} from '../lib/api/requests'
import { broadcastInvalidation } from '../lib/querySync'

export const REQUESTS_QUERY_KEY = ['requests'] as const
export const REQUEST_SUMMARY_QUERY_KEY = ['requestSummary'] as const

async function _fetchRequests(params: RequestListParams): Promise<PaginatedRequestsResponse> {
  return fetchRequests(params)
}

async function _fetchRequestSummary(): Promise<RequestSummary> {
  return fetchRequestSummary()
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

type UpdateEquipmentStatusPayload = {
  itemId: number
  status: string
}

type RestorePayload = Request

export function useRequestsQuery(params: RequestListParams) {
  return useQuery({
    queryKey: [...REQUESTS_QUERY_KEY, params] as const,
    queryFn: () => _fetchRequests(params),
    placeholderData: (previousData) => previousData,
    refetchInterval: 60_000,
  })
}

export function useRequestSummaryQuery() {
  return useQuery({
    queryKey: [...REQUEST_SUMMARY_QUERY_KEY] as const,
    queryFn: () => _fetchRequestSummary(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}

export function useRequestActions() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: REQUESTS_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: REQUEST_SUMMARY_QUERY_KEY })
    broadcastInvalidation(['requests', 'requestSummary'])
  }

  const createMutation = useMutation<void, Error, CreateRequestData>({
    mutationFn: async (payload) => {
      await createRequest(payload)
    },
    onSuccess: invalidate,
  })

  const updateMutation = useMutation<void, Error, UpdatePayload>({
    mutationFn: async ({ id, data }) => {
      await updateRequest(id, data)
    },
    onSuccess: invalidate,
  })

  const toggleIssuedMutation = useMutation<void, Error, ToggleIssuedPayload>({
    mutationFn: async ({ id, value }) => {
      await setIssued(id, value)
    },
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation<Request, Error, number>({
    mutationFn: async (id) => {
      return deleteRequest(id)
    },
    onSuccess: invalidate,
  })

  const restoreMutation = useMutation<void, Error, RestorePayload>({
    mutationFn: async (payload) => {
      await restoreRequest(payload)
    },
    onSuccess: invalidate,
  })

  const scheduleReturnMutation = useMutation<void, Error, ScheduleReturnPayload>({
    mutationFn: async ({ id, data }) => {
      await scheduleReturn(id, data)
    },
    onSuccess: invalidate,
  })

  const completeReturnMutation = useMutation<void, Error, UpdateReturnCompletionPayload>({
    mutationFn: async ({ id, value }) => {
      await completeReturn(id, value)
    },
    onSuccess: invalidate,
  })

  const cancelReturnMutation = useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await cancelReturn(id)
    },
    onSuccess: invalidate,
  })

  const updateEquipmentStatusMutation = useMutation<void, Error, UpdateEquipmentStatusPayload>({
    mutationFn: async ({ itemId, status }) => {
      await updateEquipmentItemStatus(itemId, status)
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
    updateEquipmentStatus: updateEquipmentStatusMutation.mutateAsync,
  }
}
