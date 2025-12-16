import { app, BrowserWindow, ipcMain } from 'electron'
import { createMainWindow } from './window'
import { closeDatabase, getDatabase, initDatabase } from './database'
import { registerRequestHandlers } from './ipc/requests'
import { registerEmployeeExitHandlers } from './ipc/employeeExits'
import { registerTemplateHandlers } from './ipc/templates'
import { createAutomaticBackup, registerBackupHandlers } from './ipc/backup'
import { startExitReminderScheduler } from './notifications'
import { createTray, destroyTray } from './tray'
import { initAutoUpdater, registerUpdaterHandlers } from './updater'
import { registerWindowControlHandlers } from './ipc/windowControls'

let mainWindow: BrowserWindow | null = null
let exitReminderScheduler: ReturnType<typeof startExitReminderScheduler> = null

const triggerExitReminderCheck = () => {
  if (exitReminderScheduler) {
    exitReminderScheduler.triggerCheck()
  }
}

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
  // Если приложение уже запущено, завершаем этот экземпляр
  app.quit()
} else {
  // Обработчик для второго экземпляра
  app.on('second-instance', () => {
    // Если пользователь попытался запустить второй экземпляр,
    // показываем существующее окно
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
    // Не устанавливаем mainWindow = null при закрытии
    // так как окно только скрывается, а не закрывается
  }

  // Функция для получения текущего окна
  function getMainWindow() {
    return mainWindow
  }

  // Регистрируем IPC-хендлеры управления окном заранее,
  // чтобы renderer мог вызывать их сразу после загрузки.
  registerWindowControlHandlers(getMainWindow)

  app.whenReady().then(async () => {
    await initDatabase()

    // Включаем автозапуск приложения
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: false,
    })

    registerRequestHandlers(getDatabase)
    registerEmployeeExitHandlers(getDatabase, {
      onDataChanged: triggerExitReminderCheck,
    })
    registerTemplateHandlers()
    registerBackupHandlers()
    registerUpdaterHandlers()

    exitReminderScheduler = startExitReminderScheduler(getDatabase)

    createWindow()

    // Создаем иконку в трее с функцией для получения окна
    createTray(getMainWindow)

    // Инициализируем автообновление
    initAutoUpdater(mainWindow)

    app.on('activate', () => {
      // На macOS при клике на иконку в Dock показываем окно, если оно скрыто
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

  app.on('window-all-closed', async () => {
    // Не закрываем приложение на Windows - оно работает в трее
    // На macOS тоже оставляем в трее для единообразия поведения
    // Приложение будет закрыто только через меню трея
  })

  app.on('before-quit', async () => {
    const backupResult = await createAutomaticBackup()
    if (!backupResult.success) {
      console.error('Auto backup failed:', backupResult.error)
    }

    if (exitReminderScheduler) {
      exitReminderScheduler.stop()
      exitReminderScheduler = null
    }

    await closeDatabase()
    destroyTray()
  })
}
