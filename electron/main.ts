import { app, BrowserWindow, ipcMain } from 'electron'
import { createMainWindow } from './window'
import { registerWindowControlHandlers } from './ipc/windowControls'
import { registerExternalHandlers } from './ipc/external'
import { registerMigrationHandlers } from './ipc/migration'
import { createTray, destroyTray } from './tray'
import { initAutoUpdater, registerUpdaterHandlers } from './updater'

let mainWindow: BrowserWindow | null = null

if (process.platform === 'win32') {
  app.setAppUserModelId('com.equipment.tracker')
}

// Обработчик для получения версии приложения
ipcMain.on('get-app-version', (event) => {
  event.returnValue = app.getVersion()
})

// Защита от запуска множественных экземпляров приложения
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      if (!mainWindow.isVisible()) {
        mainWindow.show()
      }
      mainWindow.focus()
    }
  })

  function createWindow() {
    mainWindow = createMainWindow()
  }

  function getMainWindow() {
    return mainWindow
  }

  registerWindowControlHandlers(getMainWindow)
  registerExternalHandlers()
  registerMigrationHandlers()

  app.whenReady().then(() => {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: false,
    })

    registerUpdaterHandlers()

    createWindow()

    createTray(getMainWindow)

    initAutoUpdater(mainWindow)

    app.on('activate', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore()
        }
        if (!mainWindow.isVisible()) {
          mainWindow.show()
        }
        mainWindow.focus()
      } else if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })

  app.on('window-all-closed', () => {
    // Приложение работает в трее — не закрываем при закрытии окна
  })

  app.on('before-quit', () => {
    destroyTray()
  })
}
