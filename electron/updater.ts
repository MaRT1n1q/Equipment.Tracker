import { app, BrowserWindow, ipcMain, shell } from 'electron'
import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import https from 'node:https'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import type { IncomingMessage } from 'node:http'
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
let manualDownloadPath: string | null = null
let manualDownloadInProgress = false

function isMacAppSigned(): boolean {
  if (process.platform !== 'darwin') {
    return true
  }

  try {
    const executablePath = app.getPath('exe')
    const appBundlePath = path.resolve(executablePath, '..', '..', '..')
    const result = spawnSync('codesign', [
      '--verify',
      '--deep',
      '--strict',
      '--verbose=2',
      appBundlePath,
    ])

    if (result.error) {
      log.warn('codesign verification failed to execute:', result.error)
      return false
    }

    if (result.status === 0) {
      return true
    }

    log.warn('codesign verification failed:', result.stderr?.toString() ?? 'unknown error')
    return false
  } catch (error) {
    log.warn('Failed to verify macOS code signature:', error)
    return false
  }
}

function sanitizeVersion(raw?: string | null): string | null {
  if (!raw) {
    return null
  }

  const trimmed = raw.trim()
  if (!trimmed) {
    return null
  }

  return trimmed.startsWith('v') ? trimmed.slice(1) : trimmed
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
        headers: {
          'User-Agent': 'EquipmentTrackerApp',
          ...headers,
        },
      },
      (response) => {
        const status = response.statusCode ?? 0
        if (status >= 300 && status < 400 && response.headers.location) {
          if (maxRedirects <= 0) {
            response.resume()
            reject(new Error('Слишком много перенаправлений при обращении к серверу обновлений'))
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
          reject(new Error(`Сервер обновлений вернул статус ${status}`))
          return
        }

        resolve(response)
      }
    )

    request.on('error', (error) => {
      reject(error)
    })
  })
}

async function fetchLatestReleaseMetadata(): Promise<GitHubRelease> {
  const response = await requestWithRedirect(
    'https://api.github.com/repos/MaRT1n1q/Equipment.Tracker/releases/latest',
    {
      Accept: 'application/vnd.github+json',
    }
  )

  return new Promise<GitHubRelease>((resolve, reject) => {
    const chunks: Buffer[] = []
    response.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    response.on('end', () => {
      try {
        const payload = Buffer.concat(chunks).toString('utf-8')
        const json = JSON.parse(payload) as GitHubRelease
        resolve(json)
      } catch (error) {
        reject(error)
      }
    })

    response.on('error', (error) => {
      reject(error)
    })
  })
}

function selectMacAsset(release: GitHubRelease): ManualUpdateInfo {
  const assets = release.assets ?? []
  if (assets.length === 0) {
    throw new Error('В последнем релизе отсутствуют файлы обновления для macOS')
  }

  const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
  const selectors: Array<(asset: GitHubAsset) => boolean> = [
    (asset) => asset.name.endsWith('.dmg') && asset.name.includes(`mac-${arch}`),
    (asset) => asset.name.endsWith('.dmg') && asset.name.includes('mac'),
    (asset) => asset.name.endsWith('.zip') && asset.name.includes(`mac-${arch}`),
    (asset) => asset.name.endsWith('.zip') && asset.name.includes('mac'),
  ]

  let selected: GitHubAsset | undefined
  for (const predicate of selectors) {
    selected = assets.find(predicate)
    if (selected) {
      break
    }
  }

  if (!selected) {
    throw new Error('Не удалось подобрать файл обновления для macOS')
  }

  const version = sanitizeVersion(release.tag_name) ?? sanitizeVersion(release.name) ?? 'unknown'

  return {
    version,
    assetName: selected.name,
    downloadUrl: selected.browser_download_url,
    size: selected.size,
  }
}

async function ensureManualUpdateInfo(forceRefresh = false): Promise<ManualUpdateInfo> {
  if (!manualUpdateInfo || forceRefresh) {
    const release = await fetchLatestReleaseMetadata()
    manualUpdateInfo = selectMacAsset(release)
  }

  return manualUpdateInfo
}

async function prepareManualUpdateInfo(window: BrowserWindow | null, forceRefresh = false) {
  try {
    const info = await ensureManualUpdateInfo(forceRefresh)
    const sizeLabel = info.size ? formatBytes(info.size) : undefined
    const detail = sizeLabel
      ? `Размер файла: ${sizeLabel}`
      : 'Размер файла будет известен после начала загрузки'

    sendStatusToWindow(
      window,
      'manual-update-info',
      `Доступно обновление v${info.version}. Скачайте установщик вручную.`,
      {
        version: info.version,
        assetName: info.assetName,
        size: info.size,
        detail,
      }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Не удалось получить информацию об обновлении'
    log.warn('Failed to prepare manual update info:', error)
    sendStatusToWindow(window, 'manual-update-error', message)
  }
}

async function fileExists(candidatePath: string): Promise<boolean> {
  try {
    await fsPromises.access(candidatePath, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function downloadManualUpdateToDisk(window: BrowserWindow | null): Promise<string> {
  const info = await ensureManualUpdateInfo()
  const downloadsDir = app.getPath('downloads')
  const targetPath = path.join(downloadsDir, info.assetName)

  manualDownloadPath = targetPath

  if (await fileExists(targetPath)) {
    await fsPromises.unlink(targetPath)
  }

  await fsPromises.mkdir(path.dirname(targetPath), { recursive: true })

  sendStatusToWindow(
    window,
    'manual-download-started',
    `Загрузка обновления v${info.version} началась`,
    {
      version: info.version,
      assetName: info.assetName,
    }
  )

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
          sendStatusToWindow(window, 'manual-download-progress', `Загрузка: ${percent}%`, {
            percent,
            downloaded,
            total: totalBytes,
          })
        } else {
          sendStatusToWindow(
            window,
            'manual-download-progress',
            `Загружено ${formatBytes(downloaded)}`,
            {
              percent: null,
              downloaded,
              total: totalBytes,
            }
          )
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

      writeStream.on('finish', () => {
        resolve()
      })

      response.pipe(writeStream)
    })

    sendStatusToWindow(
      window,
      'manual-download-complete',
      `Обновление v${info.version} загружено. Откройте файл для установки.`,
      {
        path: targetPath,
        version: info.version,
        assetName: info.assetName,
      }
    )

    shell.showItemInFolder(targetPath)
    return targetPath
  } catch (error) {
    if (await fileExists(targetPath)) {
      await fsPromises.unlink(targetPath)
    }

    const message = error instanceof Error ? error.message : 'Не удалось загрузить обновление'
    sendStatusToWindow(window, 'manual-download-error', message)
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
  updaterEnabled = false
  manualUpdateMode = false
  manualUpdateInfo = null
  manualDownloadPath = null
  manualDownloadInProgress = false
  updateAvailableVersion = null
  updateDownloaded = false
  downloadInProgress = false

  if (process.platform === 'darwin' && !isMacAppSigned()) {
    manualUpdateMode = true
    log.warn('Auto-updater disabled: macOS сборка не подписана. Включён ручной режим обновлений.')
    sendStatusToWindow(
      window,
      'manual-update-mode',
      'Автообновление недоступно: приложение не подписано. Скачайте обновление вручную.'
    )
    void prepareManualUpdateInfo(window)
    return
  }

  log.info('Auto-updater initialized')
  updaterEnabled = true

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
    updateAvailableVersion = sanitizeVersion(info.version) ?? null
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
    log.info('Manual update check routed to ручной сценарий обновления')
    if (manualUpdateMode && mainWindowRef) {
      sendStatusToWindow(
        mainWindowRef,
        'manual-update-mode',
        'Автообновление недоступно: приложение не подписано. Скачайте установщик вручную.'
      )
      void prepareManualUpdateInfo(mainWindowRef, true)
    }
    return
  }

  log.info('Manual update check initiated')
  void autoUpdater.checkForUpdates()
}

// Немедленная установка обновления (может быть вызвана из UI)
export function installUpdateNow() {
  if (!updaterEnabled) {
    log.info('Install update skipped: auto-updater disabled')
    if (manualUpdateMode && mainWindowRef) {
      sendStatusToWindow(
        mainWindowRef,
        'manual-update-mode',
        'Автообновление отключено. Используйте скачанный установщик для обновления.'
      )
    }
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
      if (manualUpdateMode) {
        const window = mainWindowRef
        if (window) {
          sendStatusToWindow(
            window,
            'manual-update-mode',
            'Автообновление отключено. Скачайте установщик вручную.'
          )
          void prepareManualUpdateInfo(window, true)
        }

        return {
          success: false,
          error: 'Автообновление отключено. Используйте ручной режим обновления.',
        }
      }

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
        error: manualUpdateMode
          ? 'Автообновление отключено. Используйте ручной режим обновления.'
          : 'Автообновление отключено для текущей сборки',
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
        error: manualUpdateMode
          ? 'Автообновление отключено. Используйте скачанный установщик для обновления.'
          : 'Автообновление отключено для текущей сборки',
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

  ipcMain.handle('manual-download-update', async () => {
    if (!manualUpdateMode) {
      return {
        success: false,
        error: 'Ручная загрузка обновления недоступна в текущей сборке',
      }
    }

    if (manualDownloadInProgress) {
      return {
        success: false,
        error: 'Загрузка обновления уже выполняется',
      }
    }

    const window = mainWindowRef

    try {
      manualDownloadInProgress = true
      const downloadPath = await downloadManualUpdateToDisk(window)
      return {
        success: true,
        data: {
          path: downloadPath,
        },
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Не удалось скачать обновление. Попробуйте позже.'
      log.error('Manual update download failed:', error)
      return {
        success: false,
        error: message,
      }
    } finally {
      manualDownloadInProgress = false
    }
  })

  ipcMain.handle('manual-open-download', async () => {
    if (!manualUpdateMode) {
      return {
        success: false,
        error: 'Ручной режим обновлений недоступен',
      }
    }

    if (!manualDownloadPath) {
      return {
        success: false,
        error: 'Файл обновления ещё не загружен',
      }
    }

    shell.showItemInFolder(manualDownloadPath)
    return { success: true }
  })
}
