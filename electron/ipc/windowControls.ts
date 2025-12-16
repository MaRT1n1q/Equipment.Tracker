import { ipcMain, type BrowserWindow } from 'electron'

const WINDOW_NOT_FOUND_ERROR = 'Окно приложения не найдено'

type GetMainWindow = () => BrowserWindow | null

export function registerWindowControlHandlers(getMainWindow: GetMainWindow) {
  ipcMain.handle('window-minimize', () => {
    const window = getMainWindow()
    if (!window) {
      return { success: false, error: WINDOW_NOT_FOUND_ERROR }
    }

    window.minimize()
    return { success: true }
  })

  ipcMain.handle('window-toggle-maximize', () => {
    const window = getMainWindow()
    if (!window) {
      return { success: false, error: WINDOW_NOT_FOUND_ERROR }
    }

    if (window.isMaximized()) {
      window.unmaximize()
    } else {
      window.maximize()
    }

    return { success: true, data: { isMaximized: window.isMaximized() } }
  })

  ipcMain.handle('window-close', () => {
    const window = getMainWindow()
    if (!window) {
      return { success: false, error: WINDOW_NOT_FOUND_ERROR }
    }

    window.close()
    return { success: true }
  })

  ipcMain.handle('get-window-state', () => {
    const window = getMainWindow()
    if (!window) {
      return { success: false, error: WINDOW_NOT_FOUND_ERROR }
    }

    return { success: true, data: { isMaximized: window.isMaximized() } }
  })
}

const broadcastFlag = Symbol('equipment-tracker:window-state-broadcast')

export function attachWindowStateBroadcast(window: BrowserWindow) {
  const anyWindow = window as unknown as Record<symbol, boolean>
  if (anyWindow[broadcastFlag]) {
    return
  }

  anyWindow[broadcastFlag] = true

  const sendState = () => {
    if (window.isDestroyed()) {
      return
    }

    window.webContents.send('window-state-changed', {
      isMaximized: window.isMaximized(),
    })
  }

  window.on('maximize', sendState)
  window.on('unmaximize', sendState)
  window.on('enter-full-screen', sendState)
  window.on('leave-full-screen', sendState)
  window.on('ready-to-show', sendState)
}
