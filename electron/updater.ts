import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

// Настраиваем логирование
log.transports.file.level = 'info'
autoUpdater.logger = log

// Настройки автообновления
autoUpdater.autoDownload = true // Автоматически загружать обновления
autoUpdater.autoInstallOnAppQuit = true // Автоматически устанавливать при выходе

let mainWindowRef: BrowserWindow | null = null
let manualCheckInProgress = false

export function initAutoUpdater(window: BrowserWindow | null) {
  // Только в production режиме
  if (!app.isPackaged) {
    log.info('Auto-updater disabled in development mode')
    return
  }

  log.info('Auto-updater initialized')
  mainWindowRef = window

  // Проверяем обновления при запуске
  autoUpdater.checkForUpdatesAndNotify()

  // Проверяем обновления каждые 4 часа
  setInterval(
    () => {
      autoUpdater.checkForUpdatesAndNotify()
    },
    4 * 60 * 60 * 1000
  )

  // События автообновления
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...')
    sendStatusToWindow(window, 'checking-for-update', 'Проверка обновлений...')
  })

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info)
    sendStatusToWindow(window, 'update-available', `Доступно обновление v${info.version}`, {
      version: info.version,
      releaseNotes: info.releaseNotes,
    })

    // Показываем уведомление пользователю
    if (window) {
      dialog.showMessageBox(window, {
        type: 'info',
        title: 'Доступно обновление',
        message: `Найдена новая версия ${info.version}`,
        detail:
          'Обновление будет загружено в фоновом режиме и установлено при следующем запуске приложения.',
        buttons: ['OK'],
      })
    }
  })

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info)
    sendStatusToWindow(window, 'update-not-available', 'Приложение обновлено до последней версии')
  })

  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater:', err)
    sendStatusToWindow(window, 'update-error', `Ошибка обновления: ${err.message}`)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    const message = `Загрузка: ${Math.round(progressObj.percent)}% (${formatBytes(progressObj.transferred)}/${formatBytes(progressObj.total)})`
    log.info(message)
    sendStatusToWindow(window, 'download-progress', message, {
      percent: progressObj.percent,
      transferred: progressObj.transferred,
      total: progressObj.total,
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info)
    sendStatusToWindow(window, 'update-downloaded', `Обновление v${info.version} загружено`, {
      version: info.version,
      downloadedAt: new Date().toISOString(),
    })

    // Спрашиваем пользователя, хочет ли он установить сейчас
    if (window) {
      dialog
        .showMessageBox(window, {
          type: 'info',
          title: 'Обновление готово к установке',
          message: `Версия ${info.version} загружена и готова к установке.`,
          detail:
            'Приложение будет перезапущено для установки обновления. Вы можете отложить установку и продолжить работу.',
          buttons: ['Перезапустить сейчас', 'Отложить'],
          defaultId: 0,
          cancelId: 1,
        })
        .then((result) => {
          if (result.response === 0) {
            // Пользователь выбрал "Перезапустить сейчас"
            log.info('User chose to install update now')
            setImmediate(() => autoUpdater.quitAndInstall())
          } else {
            log.info('User chose to defer update installation')
          }
        })
    }
  })
}

// Отправляем статус обновления в окно (для UI)
function sendStatusToWindow(
  window: BrowserWindow | null,
  event: string,
  message: string,
  data?: any
) {
  if (window && window.webContents) {
    window.webContents.send('update-status', {
      event,
      message,
      data,
    })
  }
}

// Форматирование байтов в читаемый вид
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// Ручная проверка обновлений (может быть вызвана из UI)
export function checkForUpdates() {
  if (!app.isPackaged) {
    log.info('Manual update check skipped in development mode')
    return
  }

  log.info('Manual update check initiated')
  autoUpdater.checkForUpdatesAndNotify()
}

// Немедленная установка обновления (может быть вызвана из UI)
export function installUpdateNow() {
  log.info('Installing update now')
  autoUpdater.quitAndInstall()
}

export function registerUpdaterHandlers() {
  ipcMain.handle('check-for-updates', async () => {
    if (!app.isPackaged) {
      return {
        success: false,
        error: 'Проверка обновлений доступна только в собранной версии приложения',
      }
    }

    if (manualCheckInProgress) {
      return {
        success: false,
        error: 'Проверка уже выполняется',
      }
    }

    const window = mainWindowRef

    try {
      manualCheckInProgress = true
      if (window) {
        sendStatusToWindow(window, 'checking-for-update', 'Проверка обновлений...')
      }

      await autoUpdater.checkForUpdates()
      return { success: true }
    } catch (error) {
      log.error('Manual update check failed:', error)
      const message = (error as Error).message || 'Не удалось проверить обновление'
      if (window) {
        sendStatusToWindow(window, 'update-error', `Ошибка обновления: ${message}`)
      }
      return { success: false, error: message }
    } finally {
      manualCheckInProgress = false
    }
  })

  ipcMain.handle('install-update', async () => {
    if (!app.isPackaged) {
      return {
        success: false,
        error: 'Установка обновлений недоступна в режиме разработки',
      }
    }

    try {
      autoUpdater.quitAndInstall()
      return { success: true }
    } catch (error) {
      log.error('Failed to install update immediately:', error)
      return {
        success: false,
        error: (error as Error).message || 'Не удалось установить обновление',
      }
    }
  })
}
