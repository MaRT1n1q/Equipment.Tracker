import type { ApiResponse, UpdateStatusPayload, WindowState } from './ipc'

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

      // Auto-updater
      checkForUpdates: () => Promise<ApiResponse>
      downloadUpdate: () => Promise<ApiResponse>
      installUpdate: () => Promise<ApiResponse>
      onUpdateStatus: (callback: (payload: UpdateStatusPayload) => void) => () => void

      // External links
      openExternal: (url: string) => Promise<ApiResponse>
    }
  }
}

export {}
