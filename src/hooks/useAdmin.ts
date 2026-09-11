import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AdminUserListParams, AdminUserListResponse, AdminStats } from '../lib/api/admin'
import {
  fetchAdminUsers,
  setAdminUserRole,
  setAdminUserCity,
  deleteAdminUser,
  fetchAdminStats,
  fetchAdminRegistration,
  setAdminRegistration,
} from '../lib/api/admin'

export const ADMIN_USERS_QUERY_KEY = ['adminUsers'] as const
export const ADMIN_STATS_QUERY_KEY = ['adminStats'] as const
export const ADMIN_REGISTRATION_QUERY_KEY = ['adminRegistration'] as const

export function useAdminUsersQuery(params: AdminUserListParams) {
  return useQuery({
    queryKey: [...ADMIN_USERS_QUERY_KEY, params] as const,
    queryFn: (): Promise<AdminUserListResponse> => fetchAdminUsers(params),
    placeholderData: (previousData) => previousData,
  })
}

export function useAdminStatsQuery() {
  return useQuery({
    queryKey: [...ADMIN_STATS_QUERY_KEY] as const,
    queryFn: (): Promise<AdminStats> => fetchAdminStats(),
  })
}

export function useAdminRegistrationQuery() {
  return useQuery({
    queryKey: [...ADMIN_REGISTRATION_QUERY_KEY] as const,
    queryFn: (): Promise<boolean> => fetchAdminRegistration(),
  })
}

export function useAdminActions() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
  }

  const setRoleMutation = useMutation<void, Error, { id: string; role: string }>({
    mutationFn: ({ id, role }) => setAdminUserRole(id, role),
    onSuccess: invalidate,
  })

  const setCityMutation = useMutation<void, Error, { id: string; city: string }>({
    mutationFn: ({ id, city }) => setAdminUserCity(id, city),
    onSuccess: invalidate,
  })

  const deleteUserMutation = useMutation<void, Error, string>({
    mutationFn: (id) => deleteAdminUser(id),
    onSuccess: invalidate,
  })

  const setRegistrationMutation = useMutation<void, Error, boolean>({
    mutationFn: (enabled) => setAdminRegistration(enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_REGISTRATION_QUERY_KEY })
    },
  })

  return {
    setRole: setRoleMutation,
    setCity: setCityMutation,
    deleteUser: deleteUserMutation,
    setRegistration: setRegistrationMutation,
  }
}
