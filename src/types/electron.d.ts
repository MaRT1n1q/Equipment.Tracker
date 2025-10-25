export interface EquipmentItem {
  id?: number
  request_id?: number
  equipment_name: string
  serial_number: string
  quantity: number
}

export interface Request {
  id: number
  employee_name: string
  created_at: string
  is_issued: number
  issued_at: string | null
  notes: string | null
  equipment_items: EquipmentItem[]
}

export interface EmployeeExit {
  id: number
  employee_name: string
  login: string
  exit_date: string
  equipment_list: string
  created_at: string
  is_completed: number
}

export interface CreateEmployeeExitData {
  employee_name: string
  login: string
  exit_date: string
  equipment_list: string
}

export interface CreateRequestData {
  employee_name: string
  notes?: string
  equipment_items: EquipmentItem[]
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  id?: number
}

declare global {
  interface Window {
    electronAPI: {
      getRequests: () => Promise<ApiResponse<Request[]>>
      createRequest: (data: CreateRequestData) => Promise<ApiResponse>
      updateRequest: (id: number, data: CreateRequestData) => Promise<ApiResponse>
      updateIssued: (id: number, is_issued: boolean) => Promise<ApiResponse>
      deleteRequest: (id: number) => Promise<ApiResponse<Request>>
      restoreRequest: (request: Request) => Promise<ApiResponse>
      createBackup: () => Promise<ApiResponse<{ path: string }>>
      restoreBackup: () => Promise<ApiResponse>
      // Employee Exit API
      getEmployeeExits: () => Promise<ApiResponse<EmployeeExit[]>>
      createEmployeeExit: (data: CreateEmployeeExitData) => Promise<ApiResponse>
      updateEmployeeExit: (id: number, data: CreateEmployeeExitData) => Promise<ApiResponse>
      deleteEmployeeExit: (id: number) => Promise<ApiResponse<EmployeeExit>>
      updateExitCompleted: (id: number, is_completed: boolean) => Promise<ApiResponse>
    }
  }
}

export {}
