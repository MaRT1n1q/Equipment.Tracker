import type {
  ApiResponse,
  CreateEmployeeExitData,
  CreateRequestData,
  EmployeeExit,
  Request,
  UpdateRequestData,
  UpdateStatusPayload,
} from './ipc'

declare global {
  interface Window {
    electronAPI: {
      // App info
      getAppVersion: () => string
      checkForUpdates: () => Promise<ApiResponse>
      downloadUpdate: () => Promise<ApiResponse>
      installUpdate: () => Promise<ApiResponse>
      downloadManualUpdate: () => Promise<ApiResponse<{ path: string }>>
      openManualUpdateLocation: () => Promise<ApiResponse>
      onUpdateStatus: (callback: (payload: UpdateStatusPayload) => void) => () => void
      // Requests API
      getRequests: () => Promise<ApiResponse<Request[]>>
      createRequest: (data: CreateRequestData) => Promise<ApiResponse>
      updateRequest: (id: number, data: UpdateRequestData) => Promise<ApiResponse>
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
      exportEmployeeExits: (exits: EmployeeExit[]) => Promise<ApiResponse<{ path: string }>>
    }
  }
}

export {}
