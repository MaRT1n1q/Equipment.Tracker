export interface Request {
  id: number
  employee_name: string
  equipment_name: string
  serial_number: string
  created_at: string
  is_issued: number
  issued_at: string | null
}

export interface CreateRequestData {
  employee_name: string
  equipment_name: string
  serial_number: string
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
      deleteRequest: (id: number) => Promise<ApiResponse>
    }
  }
}

export {}
