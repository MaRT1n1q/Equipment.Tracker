import type {
  ApiResponse,
  CreateEmployeeExitData,
  CreateRequestData,
  CreateTemplateData,
  EmployeeExit,
  EmployeeExitListParams,
  EmployeeExitSummary,
  PaginatedEmployeeExitsResponse,
  PaginatedRequestsResponse,
  Request,
  RequestListParams,
  RequestSummary,
  ScheduleRequestReturnData,
  Template,
  UpdateRequestData,
  UpdateStatusPayload,
  UpdateTemplateData,
  WindowState,
} from './ipc'

declare global {
  interface Window {
    electronAPI: {
      // App info
      getAppVersion: () => string

      // Window controls
      getWindowState: () => Promise<ApiResponse<WindowState>>
      minimizeWindow: () => Promise<ApiResponse>
      toggleMaximizeWindow: () => Promise<ApiResponse<{ isMaximized: boolean }>>
      closeWindow: () => Promise<ApiResponse>
      onWindowStateChanged: (callback: (payload: WindowState) => void) => () => void

      checkForUpdates: () => Promise<ApiResponse>
      downloadUpdate: () => Promise<ApiResponse>
      installUpdate: () => Promise<ApiResponse>
      onUpdateStatus: (callback: (payload: UpdateStatusPayload) => void) => () => void
      // Requests API
      getRequests: (params?: RequestListParams) => Promise<ApiResponse<PaginatedRequestsResponse>>
      getRequestSummary: () => Promise<ApiResponse<RequestSummary>>
      createRequest: (data: CreateRequestData) => Promise<ApiResponse>
      updateRequest: (id: number, data: UpdateRequestData) => Promise<ApiResponse>
      updateIssued: (id: number, is_issued: boolean) => Promise<ApiResponse>
      scheduleRequestReturn: (id: number, data: ScheduleRequestReturnData) => Promise<ApiResponse>
      completeRequestReturn: (id: number, completed: boolean) => Promise<ApiResponse>
      cancelRequestReturn: (id: number) => Promise<ApiResponse>
      deleteRequest: (id: number) => Promise<ApiResponse<Request>>
      restoreRequest: (request: Request) => Promise<ApiResponse>
      createBackup: () => Promise<ApiResponse<{ path: string }>>
      restoreBackup: () => Promise<ApiResponse>
      // Employee Exit API
      getEmployeeExits: (
        params?: EmployeeExitListParams
      ) => Promise<ApiResponse<PaginatedEmployeeExitsResponse>>
      getEmployeeExitSummary: () => Promise<ApiResponse<EmployeeExitSummary>>
      createEmployeeExit: (data: CreateEmployeeExitData) => Promise<ApiResponse>
      updateEmployeeExit: (id: number, data: CreateEmployeeExitData) => Promise<ApiResponse>
      deleteEmployeeExit: (id: number) => Promise<ApiResponse<EmployeeExit>>
      restoreEmployeeExit: (exit: EmployeeExit) => Promise<ApiResponse>
      updateExitCompleted: (id: number, is_completed: boolean) => Promise<ApiResponse>
      exportEmployeeExits: (exits: EmployeeExit[]) => Promise<ApiResponse<{ path: string }>>
      // Templates API
      getTemplates: () => Promise<ApiResponse<Template[]>>
      createTemplate: (data: CreateTemplateData) => Promise<ApiResponse<Template>>
      updateTemplate: (id: number, data: UpdateTemplateData) => Promise<ApiResponse<Template>>
      deleteTemplate: (id: number) => Promise<ApiResponse<Template>>
      reorderTemplates: (order: number[]) => Promise<ApiResponse>

      openExternal: (url: string) => Promise<ApiResponse>
    }
  }
}

export {}
