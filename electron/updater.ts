import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

// Настраиваем логирование
log.transports.file.level = 'info'
autoUpdater.logger = log

// Настройки автообновления
autoUpdater.autoDownload = false // Загружаем обновления только по запросу пользователя
autoUpdater.autoInstallOnAppQuit = false // Устанавливаем вручную после подтверждения

let mainWindowRef: BrowserWindow | null = null
let manualCheckInProgress = false
let updaterEnabled = false
let updateAvailableVersion: string | null = null
let updateDownloaded = false
let downloadInProgress = false

async function removeMacQuarantineAttribute(filePath: string): Promise<void> {
  if (process.platform !== 'darwin') {
    return
  }

  return await new Promise<void>((resolve, reject) => {
    execFile('xattr', ['-d', 'com.apple.quarantine', filePath], (error) => {
      if (error) {
        log.warn('Failed to remove quarantine attribute:', error)
        reject(error)
        return
      }

      log.info('Quarantine attribute removed from', filePath)
      resolve()
    })
  })
}

export function initAutoUpdater(window: BrowserWindow | null) {
  // Только в production режиме
  if (!app.isPackaged) {
    log.info('Auto-updater disabled in development mode')
    return
  }

  mainWindowRef = window
  updaterEnabled = true
  updateAvailableVersion = null
  updateDownloaded = false
  downloadInProgress = false

  log.info('Auto-updater initialized')

  // Проверяем обновления при запуске
  void autoUpdater.checkForUpdates()

  // Проверяем обновления каждые 4 часа
  setInterval(
    () => {
      void autoUpdater.checkForUpdates()
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
    updateAvailableVersion = info.version
    updateDownloaded = false
    downloadInProgress = false
    sendStatusToWindow(
      window,
      'update-available',
      `Доступно обновление v${info.version}. Скачайте и установите его, когда будете готовы.`,
      {
        version: info.version,
        releaseNotes: info.releaseNotes,
      }
    )
  })

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info)
    updateAvailableVersion = null
    updateDownloaded = false
    downloadInProgress = false
    sendStatusToWindow(window, 'update-not-available', 'Приложение обновлено до последней версии')
  })

  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater:', err)
    downloadInProgress = false
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
    updateDownloaded = true
    downloadInProgress = false

    // Для macOS снимаем карантинный атрибут
    if (process.platform === 'darwin') {
      const cachePath = path.join(app.getPath('userData'), 'pending-update')
      removeMacQuarantineAttribute(cachePath)
        .then(() => {
          log.info('Quarantine attribute removed successfully')
        })
        .catch((error) => {
          log.warn('Failed to remove quarantine attribute:', error)
        })
    }

    sendStatusToWindow(
      window,
      'update-downloaded',
      `Обновление v${info.version} загружено и готово к установке.`,
      {
        version: info.version,
        downloadedAt: new Date().toISOString(),
      }
    )
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

  if (!updaterEnabled) {
    log.info('Auto-updater is not enabled')
    return
  }

  log.info('Manual update check initiated')
  void autoUpdater.checkForUpdates()
}

// Немедленная установка обновления (может быть вызвана из UI)
export function installUpdateNow() {
  if (!updaterEnabled) {
    log.info('Install update skipped: auto-updater disabled')
    return
  }

  if (!updateDownloaded) {
    log.info('Install update skipped: update not downloaded')
    if (mainWindowRef) {
      sendStatusToWindow(
        mainWindowRef,
        'update-error',
        'Сначала загрузите обновление через настройки'
      )
    }
    return
  }

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

    if (!updaterEnabled) {
      return {
        success: false,
        error: 'Автообновление отключено для текущей сборки',
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

  ipcMain.handle('download-update', async () => {
    if (!app.isPackaged) {
      return {
        success: false,
        error: 'Загрузка обновления доступна только в собранной версии приложения',
      }
    }

    if (!updaterEnabled) {
      return {
        success: false,
        error: 'Автообновление отключено для текущей сборки',
      }
    }

    if (!updateAvailableVersion) {
      return {
        success: false,
        error: 'Сначала выполните проверку обновлений',
      }
    }

    if (downloadInProgress) {
      return {
        success: false,
        error: 'Загрузка обновления уже выполняется',
      }
    }

    if (updateDownloaded) {
      return {
        success: false,
        error: 'Обновление уже загружено и готово к установке',
      }
    }

    const window = mainWindowRef

    try {
      downloadInProgress = true
      if (window) {
        sendStatusToWindow(
          window,
          'download-started',
          `Загрузка обновления${updateAvailableVersion ? ` v${updateAvailableVersion}` : ''} началась`,
          {
            version: updateAvailableVersion,
          }
        )
      }

      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (error) {
      downloadInProgress = false
      const message = (error as Error).message || 'Не удалось скачать обновление'
      if (window) {
        sendStatusToWindow(window, 'update-error', `Ошибка обновления: ${message}`)
      }
      log.error('Download update failed:', error)
      return {
        success: false,
        error: message,
      }
    } finally {
      if (!updateDownloaded) {
        downloadInProgress = false
      }
    }
  })

  ipcMain.handle('install-update', async () => {
    if (!app.isPackaged) {
      return {
        success: false,
        error: 'Установка обновлений недоступна в режиме разработки',
      }
    }

    if (!updaterEnabled) {
      return {
        success: false,
        error: 'Автообновление отключено для текущей сборки',
      }
    }

    if (!updateDownloaded) {
      return {
        success: false,
        error: 'Сначала загрузите обновление через настройки',
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
