import { app, BrowserWindow, ipcMain, shell } from 'electron'
import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import https from 'node:https'
import path from 'node:path'
import type { IncomingMessage } from 'node:http'
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
let manualUpdateMode = false
let updateAvailableVersion: string | null = null
let updateDownloaded = false
let downloadInProgress = false

interface ManualUpdateInfo {
  version: string
  assetName: string
  downloadUrl: string
  size?: number
}

let manualUpdateInfo: ManualUpdateInfo | null = null

async function removeMacQuarantineAttribute(filePath: string): Promise<void> {
  if (process.platform !== 'darwin') {
    return
  }

  return await new Promise<void>((resolve, reject) => {
    // Используем -r для рекурсивного удаления атрибута
    execFile('xattr', ['-dr', 'com.apple.quarantine', filePath], (error) => {
      if (error) {
        // Игнорируем ошибку "No such file", так как файл может еще не существовать
        if (error.message.includes('No such file')) {
          log.info('File does not exist yet, will try again after extraction:', filePath)
          resolve()
          return
        }
        log.warn('Failed to remove quarantine attribute:', error)
        reject(error)
        return
      }

      log.info('Quarantine attribute removed from', filePath)
      resolve()
    })
  })
}

function getCurrentVersion(): string | null {
  const version = app.getVersion()
  return version ? version.trim().replace(/^v/, '') : null
}

function parseVersionSegment(segment: string): number {
  const numericPart = segment.match(/\d+/)?.[0]
  if (!numericPart) {
    return 0
  }
  const parsed = Number.parseInt(numericPart, 10)
  return Number.isNaN(parsed) ? 0 : parsed
}

function isVersionNewer(currentVersion: string | null, candidateVersion: string | null): boolean {
  if (!candidateVersion) return false
  if (!currentVersion) return true

  const currentSegments = currentVersion.split('.')
  const candidateSegments = candidateVersion.split('.')
  const maxLength = Math.max(currentSegments.length, candidateSegments.length)

  for (let i = 0; i < maxLength; i++) {
    const current = parseVersionSegment(currentSegments[i] ?? '0')
    const candidate = parseVersionSegment(candidateSegments[i] ?? '0')
    if (candidate > current) return true
    if (candidate < current) return false
  }
  return false
}

interface GitHubAsset {
  name: string
  browser_download_url: string
  size?: number
}

interface GitHubRelease {
  tag_name?: string
  name?: string
  assets?: GitHubAsset[]
}

function requestWithRedirect(
  urlString: string,
  headers: Record<string, string>,
  maxRedirects = 5
): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const urlObject = new URL(urlString)
    const request = https.get(
      {
        protocol: urlObject.protocol,
        hostname: urlObject.hostname,
        path: `${urlObject.pathname}${urlObject.search}`,
        headers: { 'User-Agent': 'EquipmentTrackerApp', ...headers },
      },
      (response) => {
        const status = response.statusCode ?? 0
        if (status >= 300 && status < 400 && response.headers.location) {
          if (maxRedirects <= 0) {
            response.resume()
            reject(new Error('Слишком много перенаправлений'))
            return
          }
          const redirectUrl = new URL(response.headers.location, urlString).toString()
          response.resume()
          requestWithRedirect(redirectUrl, headers, maxRedirects - 1)
            .then(resolve)
            .catch(reject)
          return
        }
        if (status < 200 || status >= 300) {
          response.resume()
          reject(new Error(`Сервер вернул статус ${status}`))
          return
        }
        resolve(response)
      }
    )
    request.on('error', reject)
  })
}

async function fetchLatestReleaseMetadata(): Promise<GitHubRelease> {
  const response = await requestWithRedirect(
    'https://api.github.com/repos/MaRT1n1q/Equipment.Tracker/releases/latest',
    { Accept: 'application/vnd.github+json' }
  )

  return new Promise<GitHubRelease>((resolve, reject) => {
    const chunks: Buffer[] = []
    response.on('data', (chunk: Buffer) => chunks.push(chunk))
    response.on('end', () => {
      try {
        const payload = Buffer.concat(chunks).toString('utf-8')
        const json = JSON.parse(payload) as GitHubRelease
        resolve(json)
      } catch (error) {
        reject(error)
      }
    })
    response.on('error', reject)
  })
}

function selectMacAsset(release: GitHubRelease): ManualUpdateInfo {
  const assets = release.assets ?? []
  if (assets.length === 0) {
    throw new Error('В последнем релизе отсутствуют файлы обновления для macOS')
  }

  const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
  const selectors: Array<(asset: GitHubAsset) => boolean> = [
    (asset) => asset.name.endsWith('.zip') && asset.name.includes(`mac-${arch}`),
    (asset) => asset.name.endsWith('.zip') && asset.name.includes('mac'),
    (asset) => asset.name.endsWith('.dmg') && asset.name.includes(`mac-${arch}`),
    (asset) => asset.name.endsWith('.dmg') && asset.name.includes('mac'),
  ]

  let selected: GitHubAsset | undefined
  for (const predicate of selectors) {
    selected = assets.find(predicate)
    if (selected) break
  }

  if (!selected) {
    throw new Error('Не удалось подобрать файл обновления для macOS')
  }

  const version = (release.tag_name || release.name || 'unknown').replace(/^v/, '')

  return {
    version,
    assetName: selected.name,
    downloadUrl: selected.browser_download_url,
    size: selected.size,
  }
}

async function ensureManualUpdateInfo(): Promise<ManualUpdateInfo | null> {
  if (!manualUpdateInfo) {
    const release = await fetchLatestReleaseMetadata()
    const candidate = selectMacAsset(release)
    const currentVersion = getCurrentVersion()

    if (!isVersionNewer(currentVersion, candidate.version)) {
      manualUpdateInfo = null
      return null
    }
    manualUpdateInfo = candidate
  }
  return manualUpdateInfo
}

async function downloadManualUpdate(window: BrowserWindow | null): Promise<void> {
  const info = await ensureManualUpdateInfo()
  if (!info) {
    sendStatusToWindow(window, 'update-not-available', 'Обновление не требуется')
    return
  }

  const downloadsDir = app.getPath('downloads')
  const targetPath = path.join(downloadsDir, info.assetName)

  try {
    // Удаляем старый файл если есть
    if (fs.existsSync(targetPath)) {
      await fsPromises.unlink(targetPath)
    }
  } catch (error) {
    log.warn('Failed to delete old file:', error)
  }

  await fsPromises.mkdir(path.dirname(targetPath), { recursive: true })

  sendStatusToWindow(window, 'download-started', `Загрузка обновления v${info.version} началась`, {
    version: info.version,
    assetName: info.assetName,
  })

  try {
    const response = await requestWithRedirect(info.downloadUrl, {
      Accept: 'application/octet-stream',
    })

    const totalBytes = Number(response.headers['content-length'] ?? info.size ?? 0)
    let downloaded = 0

    await new Promise<void>((resolve, reject) => {
      const writeStream = fs.createWriteStream(targetPath)

      response.on('data', (chunk: Buffer) => {
        downloaded += chunk.length
        if (totalBytes > 0) {
          const percent = Math.min(100, Math.round((downloaded / totalBytes) * 100))
          sendStatusToWindow(window, 'download-progress', `Загрузка: ${percent}%`, {
            percent,
            downloaded,
            total: totalBytes,
          })
        }
      })

      response.on('error', (error) => {
        writeStream.destroy()
        reject(error)
      })

      writeStream.on('error', (error) => {
        response.destroy()
        reject(error)
      })

      writeStream.on('finish', resolve)
      response.pipe(writeStream)
    })

    // Снимаем карантинный атрибут
    try {
      await removeMacQuarantineAttribute(targetPath)
      log.info('Quarantine removed from downloaded file')
    } catch (error) {
      log.warn('Failed to remove quarantine:', error)
    }

    sendStatusToWindow(window, 'update-downloaded', `Обновление v${info.version} загружено`, {
      version: info.version,
      downloadedAt: new Date().toISOString(),
    })

    // Автоматически открываем установщик
    try {
      const result = await shell.openPath(targetPath)
      if (result) {
        log.warn('Failed to open installer:', result)
        sendStatusToWindow(window, 'info', 'Откройте файл в папке Загрузки для установки')
      } else {
        log.info('Installer opened successfully')
        sendStatusToWindow(window, 'info', 'Установщик открыт. Завершите установку.')
      }
    } catch (error) {
      log.warn('Failed to open installer:', error)
      sendStatusToWindow(window, 'info', 'Откройте файл в папке Загрузки для установки')
    }

    shell.showItemInFolder(targetPath)
  } catch (error) {
    if (fs.existsSync(targetPath)) {
      await fsPromises.unlink(targetPath)
    }
    const message = error instanceof Error ? error.message : 'Не удалось загрузить обновление'
    sendStatusToWindow(window, 'update-error', message)
    throw error
  }
}

export function initAutoUpdater(window: BrowserWindow | null) {
  // Только в production режиме
  if (!app.isPackaged) {
    log.info('Auto-updater disabled in development mode')
    return
  }

  mainWindowRef = window

  // На macOS используем ручной режим (из-за проблем с проверкой подписи)
  if (process.platform === 'darwin') {
    manualUpdateMode = true
    updaterEnabled = false
    log.info('Auto-updater: using manual mode for macOS')

    // Проверяем обновления при запуске
    void ensureManualUpdateInfo()
      .then((info) => {
        if (info) {
          sendStatusToWindow(
            window,
            'update-available',
            `Доступно обновление v${info.version}. Скачайте и установите его, когда будете готовы.`,
            { version: info.version }
          )
        }
      })
      .catch((error) => {
        log.warn('Failed to check for updates:', error)
      })
    return
  }

  // Для Windows/Linux используем стандартный electron-updater
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

  autoUpdater.on('update-downloaded', async (info) => {
    log.info('Update downloaded:', info)
    updateDownloaded = true
    downloadInProgress = false

    // Для macOS снимаем карантинный атрибут с загруженного файла и папки кэша
    if (process.platform === 'darwin') {
      const pathsToClean: string[] = []

      if (info.downloadedFile) {
        pathsToClean.push(info.downloadedFile)
        log.info('Will remove quarantine from downloaded file:', info.downloadedFile)
      }

      // Также пробуем очистить папку кэша, где electron-updater распаковывает файлы
      const cacheDir = app.getPath('userData')
      const shipItCache = `/Users/${process.env.USER}/Library/Caches/com.equipment.tracker.ShipIt`
      const commonCachePaths = [
        `${cacheDir}/pending-update`,
        `/Users/${process.env.USER}/Library/Caches/equipment-tracker-updater`,
        shipItCache,
      ]
      pathsToClean.push(...commonCachePaths)

      // Первый проход - очистка известных путей
      for (const filePath of pathsToClean) {
        try {
          await removeMacQuarantineAttribute(filePath)
          log.info('Quarantine attribute removed successfully from', filePath)
        } catch (error) {
          log.warn('Failed to remove quarantine attribute from', filePath, ':', error)
        }
      }

      // Даем время на распаковку и пробуем очистить папку ShipIt еще раз
      // (там будут распакованные файлы)
      setTimeout(async () => {
        try {
          log.info('Attempting to remove quarantine from ShipIt cache after delay...')
          await removeMacQuarantineAttribute(shipItCache)
          log.info('Second pass: quarantine removed from ShipIt cache')
        } catch (error) {
          log.warn('Second pass failed to remove quarantine from ShipIt:', error)
        }
      }, 1000)
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

    if (manualCheckInProgress) {
      return {
        success: false,
        error: 'Проверка уже выполняется',
      }
    }

    const window = mainWindowRef

    // Для macOS используем ручной режим
    if (manualUpdateMode) {
      try {
        manualCheckInProgress = true
        if (window) {
          sendStatusToWindow(window, 'checking-for-update', 'Проверка обновлений...')
        }

        const info = await ensureManualUpdateInfo()
        if (info) {
          sendStatusToWindow(
            window,
            'update-available',
            `Доступно обновление v${info.version}. Скачайте и установите его, когда будете готовы.`,
            { version: info.version }
          )
        } else {
          sendStatusToWindow(
            window,
            'update-not-available',
            'Приложение обновлено до последней версии'
          )
        }
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
    }

    // Для Windows/Linux используем стандартный electron-updater
    if (!updaterEnabled) {
      return {
        success: false,
        error: 'Автообновление отключено для текущей сборки',
      }
    }

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

    const window = mainWindowRef

    // Для macOS используем ручной режим
    if (manualUpdateMode) {
      if (downloadInProgress) {
        return {
          success: false,
          error: 'Загрузка обновления уже выполняется',
        }
      }

      try {
        downloadInProgress = true
        await downloadManualUpdate(window)
        return { success: true }
      } catch (error) {
        const message = (error as Error).message || 'Не удалось скачать обновление'
        log.error('Manual update download failed:', error)
        return {
          success: false,
          error: message,
        }
      } finally {
        downloadInProgress = false
      }
    }

    // Для Windows/Linux используем стандартный electron-updater
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
