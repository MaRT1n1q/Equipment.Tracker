import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'
import type { ApiResponse, UpdateStatusPayload, WindowState } from '../src/types/ipc'

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

  // Auto-updater
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

  // External links
  openExternal: (url: string): Promise<ApiResponse> => ipcRenderer.invoke('open-external', url),
})
