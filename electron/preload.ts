const { contextBridge, ipcRenderer } = require('electron')

interface EquipmentItem {
  id?: number
  request_id?: number
  equipment_name: string
  serial_number: string
  quantity: number
}

interface Request {
  id: number
  employee_name: string
  created_at: string
  is_issued: number
  issued_at: string | null
  notes: string | null
  equipment_items: EquipmentItem[]
}

interface CreateRequestData {
  employee_name: string
  notes?: string
  equipment_items: EquipmentItem[]
}

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  id?: number
}

contextBridge.exposeInMainWorld('electronAPI', {
  getRequests: (): Promise<ApiResponse<Request[]>> => 
    ipcRenderer.invoke('get-requests'),
  
  createRequest: (data: CreateRequestData): Promise<ApiResponse> => 
    ipcRenderer.invoke('create-request', data),
  
  updateRequest: (id: number, data: CreateRequestData): Promise<ApiResponse> => 
    ipcRenderer.invoke('update-request', id, data),
  
  updateIssued: (id: number, is_issued: boolean): Promise<ApiResponse> => 
    ipcRenderer.invoke('update-issued', id, is_issued),
  
  deleteRequest: (id: number): Promise<ApiResponse> => 
    ipcRenderer.invoke('delete-request', id),
  
  restoreRequest: (request: Request): Promise<ApiResponse> => 
    ipcRenderer.invoke('restore-request', request),
  
  createBackup: (): Promise<ApiResponse> => 
    ipcRenderer.invoke('create-backup'),
  
  restoreBackup: (): Promise<ApiResponse> => 
    ipcRenderer.invoke('restore-backup'),
})
