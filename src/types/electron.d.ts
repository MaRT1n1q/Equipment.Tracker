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
    }
  }
}

export {}
