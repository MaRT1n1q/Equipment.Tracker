import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'
import type {
  ApiResponse,
  CreateEmployeeExitData,
  CreateRequestData,
  EmployeeExit,
  Request,
  ScheduleRequestReturnData,
  UpdateRequestData,
  UpdateStatusPayload,
} from '../src/types/ipc'

contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: (): string => ipcRenderer.sendSync('get-app-version'),

  checkForUpdates: (): Promise<ApiResponse> => ipcRenderer.invoke('check-for-updates'),

  downloadUpdate: (): Promise<ApiResponse> => ipcRenderer.invoke('download-update'),

  installUpdate: (): Promise<ApiResponse> => ipcRenderer.invoke('install-update'),

  downloadManualUpdate: (): Promise<ApiResponse<{ path: string }>> =>
    ipcRenderer.invoke('manual-download-update'),

  openManualUpdateLocation: (): Promise<ApiResponse> => ipcRenderer.invoke('manual-open-download'),

  onUpdateStatus: (callback: (payload: UpdateStatusPayload) => void) => {
    const listener = (_event: IpcRendererEvent, payload: UpdateStatusPayload) => {
      callback(payload)
    }
    ipcRenderer.on('update-status', listener)
    return () => {
      ipcRenderer.removeListener('update-status', listener)
    }
  },

  getRequests: (): Promise<ApiResponse<Request[]>> => ipcRenderer.invoke('get-requests'),

  createRequest: (data: CreateRequestData): Promise<ApiResponse> =>
    ipcRenderer.invoke('create-request', data),

  updateRequest: (id: number, data: UpdateRequestData): Promise<ApiResponse> =>
    ipcRenderer.invoke('update-request', id, data),

  updateIssued: (id: number, is_issued: boolean): Promise<ApiResponse> =>
    ipcRenderer.invoke('update-issued', id, is_issued),

  scheduleRequestReturn: (id: number, data: ScheduleRequestReturnData): Promise<ApiResponse> =>
    ipcRenderer.invoke('schedule-request-return', id, data),

  completeRequestReturn: (id: number, completed: boolean): Promise<ApiResponse> =>
    ipcRenderer.invoke('complete-request-return', id, completed),

  cancelRequestReturn: (id: number): Promise<ApiResponse> =>
    ipcRenderer.invoke('cancel-request-return', id),

  deleteRequest: (id: number): Promise<ApiResponse> => ipcRenderer.invoke('delete-request', id),

  restoreRequest: (request: Request): Promise<ApiResponse> =>
    ipcRenderer.invoke('restore-request', request),

  createBackup: (): Promise<ApiResponse> => ipcRenderer.invoke('create-backup'),

  restoreBackup: (): Promise<ApiResponse> => ipcRenderer.invoke('restore-backup'),

  // Employee Exit API
  getEmployeeExits: (): Promise<ApiResponse<EmployeeExit[]>> =>
    ipcRenderer.invoke('get-employee-exits'),

  createEmployeeExit: (data: CreateEmployeeExitData): Promise<ApiResponse> =>
    ipcRenderer.invoke('create-employee-exit', data),

  updateEmployeeExit: (id: number, data: CreateEmployeeExitData): Promise<ApiResponse> =>
    ipcRenderer.invoke('update-employee-exit', id, data),

  deleteEmployeeExit: (id: number): Promise<ApiResponse<EmployeeExit>> =>
    ipcRenderer.invoke('delete-employee-exit', id),

  updateExitCompleted: (id: number, is_completed: boolean): Promise<ApiResponse> =>
    ipcRenderer.invoke('update-exit-completed', id, is_completed),

  exportEmployeeExits: (exits: EmployeeExit[]): Promise<ApiResponse<{ path: string }>> =>
    ipcRenderer.invoke('export-employee-exits', exits),
})
