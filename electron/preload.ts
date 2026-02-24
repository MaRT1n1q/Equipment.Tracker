import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'
import type {
  ApiResponse,
  CreateEmployeeExitData,
  CreateInstructionData,
  CreateRequestData,
  CreateTemplateData,
  EmployeeExit,
  EmployeeExitListParams,
  EmployeeExitSummary,
  EquipmentStatus,
  Instruction,
  InstructionAttachment,
  InstructionAttachmentPreview,
  MoveInstructionData,
  PaginatedEmployeeExitsResponse,
  PaginatedRequestsResponse,
  ReorderInstructionsData,
  Request,
  RequestListParams,
  RequestSummary,
  ScheduleRequestReturnData,
  Template,
  TemplateFile,
  TemplateFilePreview,
  UpdateInstructionData,
  UpdateRequestData,
  UpdateStatusPayload,
  UpdateTemplateData,
  WindowState,
} from '../src/types/ipc'

contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: (): string => ipcRenderer.sendSync('get-app-version'),

  // Window controls
  getWindowState: (): Promise<ApiResponse<WindowState>> => ipcRenderer.invoke('get-window-state'),

  minimizeWindow: (): Promise<ApiResponse> => ipcRenderer.invoke('window-minimize'),

  toggleMaximizeWindow: (): Promise<ApiResponse<{ isMaximized: boolean }>> =>
    ipcRenderer.invoke('window-toggle-maximize'),

  closeWindow: (): Promise<ApiResponse> => ipcRenderer.invoke('window-close'),

  onWindowStateChanged: (callback: (payload: WindowState) => void) => {
    const listener = (_event: IpcRendererEvent, payload: WindowState) => {
      callback(payload)
    }

    ipcRenderer.on('window-state-changed', listener)
    return () => {
      ipcRenderer.removeListener('window-state-changed', listener)
    }
  },

  checkForUpdates: (): Promise<ApiResponse> => ipcRenderer.invoke('check-for-updates'),

  downloadUpdate: (): Promise<ApiResponse> => ipcRenderer.invoke('download-update'),

  installUpdate: (): Promise<ApiResponse> => ipcRenderer.invoke('install-update'),

  onUpdateStatus: (callback: (payload: UpdateStatusPayload) => void) => {
    const listener = (_event: IpcRendererEvent, payload: UpdateStatusPayload) => {
      callback(payload)
    }
    ipcRenderer.on('update-status', listener)
    return () => {
      ipcRenderer.removeListener('update-status', listener)
    }
  },

  getRequests: (params?: RequestListParams): Promise<ApiResponse<PaginatedRequestsResponse>> =>
    ipcRenderer.invoke('get-requests', params),

  getRequestSummary: (): Promise<ApiResponse<RequestSummary>> =>
    ipcRenderer.invoke('get-requests-summary'),

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

  updateEquipmentStatus: (itemId: number, status: string): Promise<ApiResponse> =>
    ipcRenderer.invoke('update-equipment-status', itemId, status),

  createBackup: (): Promise<ApiResponse> => ipcRenderer.invoke('create-backup'),

  restoreBackup: (): Promise<ApiResponse> => ipcRenderer.invoke('restore-backup'),

  // Employee Exit API
  getEmployeeExits: (
    params?: EmployeeExitListParams
  ): Promise<ApiResponse<PaginatedEmployeeExitsResponse>> =>
    ipcRenderer.invoke('get-employee-exits', params),

  getEmployeeExitSummary: (): Promise<ApiResponse<EmployeeExitSummary>> =>
    ipcRenderer.invoke('get-employee-exits-summary'),

  createEmployeeExit: (data: CreateEmployeeExitData): Promise<ApiResponse> =>
    ipcRenderer.invoke('create-employee-exit', data),

  updateEmployeeExit: (id: number, data: CreateEmployeeExitData): Promise<ApiResponse> =>
    ipcRenderer.invoke('update-employee-exit', id, data),

  deleteEmployeeExit: (id: number): Promise<ApiResponse<EmployeeExit>> =>
    ipcRenderer.invoke('delete-employee-exit', id),

  restoreEmployeeExit: (exit: EmployeeExit): Promise<ApiResponse> =>
    ipcRenderer.invoke('restore-employee-exit', exit),

  updateExitCompleted: (id: number, is_completed: boolean): Promise<ApiResponse> =>
    ipcRenderer.invoke('update-exit-completed', id, is_completed),

  updateExitEquipmentStatus: (
    exitId: number,
    equipmentIndex: number,
    status: EquipmentStatus
  ): Promise<ApiResponse> =>
    ipcRenderer.invoke('update-exit-equipment-status', { exitId, equipmentIndex, status }),

  exportEmployeeExits: (exits: EmployeeExit[]): Promise<ApiResponse<{ path: string }>> =>
    ipcRenderer.invoke('export-employee-exits', exits),

  // Templates API
  getTemplates: (): Promise<ApiResponse<Template[]>> => ipcRenderer.invoke('get-templates'),

  createTemplate: (data: CreateTemplateData): Promise<ApiResponse<Template>> =>
    ipcRenderer.invoke('create-template', data),

  updateTemplate: (id: number, data: UpdateTemplateData): Promise<ApiResponse<Template>> =>
    ipcRenderer.invoke('update-template', id, data),

  deleteTemplate: (id: number): Promise<ApiResponse<Template>> =>
    ipcRenderer.invoke('delete-template', id),

  reorderTemplates: (order: number[]): Promise<ApiResponse> =>
    ipcRenderer.invoke('reorder-templates', { order }),

  // Template Files API
  getTemplateFiles: (templateId: number): Promise<ApiResponse<TemplateFile[]>> =>
    ipcRenderer.invoke('get-template-files', templateId),

  uploadTemplateFilesDialog: (templateId: number): Promise<ApiResponse<TemplateFile[]>> =>
    ipcRenderer.invoke('upload-template-files-dialog', templateId),

  uploadTemplateFilesByPaths: (
    templateId: number,
    filePaths: string[]
  ): Promise<ApiResponse<TemplateFile[]>> =>
    ipcRenderer.invoke('upload-template-files-by-paths', templateId, filePaths),

  downloadTemplateFile: (fileId: number): Promise<ApiResponse<{ path: string }>> =>
    ipcRenderer.invoke('download-template-file', fileId),

  openTemplateFile: (fileId: number): Promise<ApiResponse> =>
    ipcRenderer.invoke('open-template-file', fileId),

  deleteTemplateFile: (fileId: number): Promise<ApiResponse<TemplateFile>> =>
    ipcRenderer.invoke('delete-template-file', fileId),

  getTemplateFilePreview: (fileId: number): Promise<ApiResponse<TemplateFilePreview>> =>
    ipcRenderer.invoke('get-template-file-preview', fileId),

  getTemplateFileCounts: (): Promise<ApiResponse<Record<number, number>>> =>
    ipcRenderer.invoke('get-template-file-counts'),

  openExternal: (url: string): Promise<ApiResponse> => ipcRenderer.invoke('open-external', url),

  // Instructions API
  getInstructions: (): Promise<ApiResponse<Instruction[]>> =>
    ipcRenderer.invoke('get-instructions'),

  getInstruction: (id: number): Promise<ApiResponse<Instruction>> =>
    ipcRenderer.invoke('get-instruction', id),

  createInstruction: (data: CreateInstructionData): Promise<ApiResponse<Instruction>> =>
    ipcRenderer.invoke('create-instruction', data),

  updateInstruction: (id: number, data: UpdateInstructionData): Promise<ApiResponse<Instruction>> =>
    ipcRenderer.invoke('update-instruction', id, data),

  moveInstruction: (id: number, data: MoveInstructionData): Promise<ApiResponse<Instruction>> =>
    ipcRenderer.invoke('move-instruction', id, data),

  reorderInstructions: (data: ReorderInstructionsData): Promise<ApiResponse> =>
    ipcRenderer.invoke('reorder-instructions', data),

  deleteInstruction: (id: number): Promise<ApiResponse<Instruction>> =>
    ipcRenderer.invoke('delete-instruction', id),

  duplicateInstruction: (id: number): Promise<ApiResponse<Instruction>> =>
    ipcRenderer.invoke('duplicate-instruction', id),

  toggleInstructionFavorite: (id: number): Promise<ApiResponse<Instruction>> =>
    ipcRenderer.invoke('toggle-instruction-favorite', id),

  updateInstructionTags: (id: number, tags: string[]): Promise<ApiResponse<Instruction>> =>
    ipcRenderer.invoke('update-instruction-tags', id, tags),

  getAllInstructionTags: (): Promise<ApiResponse<string[]>> =>
    ipcRenderer.invoke('get-all-instruction-tags'),

  // Instruction Attachments API
  getInstructionAttachments: (
    instructionId: number
  ): Promise<ApiResponse<InstructionAttachment[]>> =>
    ipcRenderer.invoke('get-instruction-attachments', instructionId),

  addInstructionAttachment: (
    instructionId: number,
    filePath: string
  ): Promise<ApiResponse<InstructionAttachment>> =>
    ipcRenderer.invoke('add-instruction-attachment', instructionId, filePath),

  deleteInstructionAttachment: (attachmentId: number): Promise<ApiResponse> =>
    ipcRenderer.invoke('delete-instruction-attachment', attachmentId),

  getInstructionAttachmentPreview: (
    attachmentId: number
  ): Promise<ApiResponse<InstructionAttachmentPreview>> =>
    ipcRenderer.invoke('get-instruction-attachment-preview', attachmentId),

  openInstructionAttachment: (attachmentId: number): Promise<ApiResponse> =>
    ipcRenderer.invoke('open-instruction-attachment', attachmentId),

  selectInstructionAttachmentFile: (): Promise<ApiResponse<string | null>> =>
    ipcRenderer.invoke('select-instruction-attachment-file'),
})
