/**
 * Платформенная абстракция.
 *
 * Единая точка для определения среды выполнения (Electron vs Web) и доступа к
 * нативным возможностям ОС. В web-режиме предоставляет безопасные fallback'и.
 *
 * Компоненты НЕ должны обращаться к window.electronAPI напрямую —
 * используйте функции из этого модуля.
 */

import { getAuthSession } from './auth'

/**
 * true, если код выполняется внутри Electron (desktop-приложение).
 *
 * В web-сборке (WEB_ONLY=1) __IS_ELECTRON__ = false на этапе компиляции,
 * поэтому весь код внутри `if (isElectron)` tree-shake'ится.
 * В desktop-сборке дополнительно проверяется наличие window.electronAPI в runtime.
 */
export const isElectron =
  typeof __IS_ELECTRON__ !== 'undefined' &&
  __IS_ELECTRON__ &&
  typeof window !== 'undefined' &&
  typeof window.electronAPI !== 'undefined'

/** true, если код выполняется в обычном браузере (web-версия). */
export const isWeb = !isElectron

// ─── Версия приложения ───────────────────────────────────────────────────────

let cachedVersion: string | null = null

/**
 * Возвращает версию приложения.
 * В Electron — из app.getVersion() через IPC, в web — из __APP_VERSION__ (vite define).
 */
export function getAppVersion(): string {
  if (cachedVersion) return cachedVersion

  if (isElectron && window.electronAPI?.getAppVersion) {
    cachedVersion = window.electronAPI.getAppVersion() || '0.0.0'
  } else {
    // __APP_VERSION__ инжектится через vite define (см. vite.config.ts)
    cachedVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0'
  }
  return cachedVersion
}

// ─── Внешние ссылки ──────────────────────────────────────────────────────────

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Открывает внешнюю ссылку.
 * В Electron — через системный браузер (IPC openExternal).
 * В web — в новой вкладке с noopener,noreferrer.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (!isSafeUrl(url)) return

  if (isElectron && window.electronAPI?.openExternal) {
    await window.electronAPI.openExternal(url)
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

// ─── Управление окном (только Electron) ──────────────────────────────────────

export const windowControls = {
  isAvailable: isElectron && !!window.electronAPI?.minimizeWindow,

  async minimize(): Promise<void> {
    if (isElectron) await window.electronAPI.minimizeWindow()
  },

  async toggleMaximize(): Promise<boolean> {
    if (!isElectron) return false
    const res = await window.electronAPI.toggleMaximizeWindow()
    return res.data?.isMaximized ?? false
  },

  async close(): Promise<void> {
    if (isElectron) await window.electronAPI.closeWindow()
  },

  async getState() {
    if (!isElectron) return null
    const res = await window.electronAPI.getWindowState()
    return res.data ?? null
  },

  onStateChanged(callback: (payload: import('../types/ipc').WindowState) => void): () => void {
    if (!isElectron || !window.electronAPI?.onWindowStateChanged) return () => {}
    return window.electronAPI.onWindowStateChanged(callback)
  },
}

// ─── Автообновление (только Electron) ────────────────────────────────────────

export const appUpdater = {
  isAvailable: isElectron && !!window.electronAPI?.checkForUpdates,

  async checkForUpdates(): Promise<void> {
    if (isElectron) await window.electronAPI.checkForUpdates()
  },

  async downloadUpdate(): Promise<void> {
    if (isElectron) await window.electronAPI.downloadUpdate()
  },

  async installUpdate(): Promise<void> {
    if (isElectron) await window.electronAPI.installUpdate()
  },

  onStatus(callback: (payload: import('../types/ipc').UpdateStatusPayload) => void): () => void {
    if (!isElectron || !window.electronAPI?.onUpdateStatus) return () => {}
    return window.electronAPI.onUpdateStatus(callback)
  },
}

// ─── Миграция SQLite → backend (только Electron) ─────────────────────────────

export const legacyMigration = {
  isAvailable: isElectron && !!window.electronAPI?.getMigrationStatus,

  async getStatus(): Promise<import('../types/ipc').MigrationStatus | null> {
    if (!isElectron) return null
    return window.electronAPI.getMigrationStatus()
  },

  async run(): Promise<import('../types/ipc').MigrationResult | null> {
    if (!isElectron) return null
    const session = getAuthSession()
    if (!session?.accessToken) {
      throw new Error('Требуется авторизация для миграции')
    }
    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:9090'
    return window.electronAPI.runMigration(apiBase, session.accessToken)
  },

  async skip(): Promise<void> {
    if (isElectron && window.electronAPI?.skipMigration) {
      await window.electronAPI.skipMigration()
    }
  },
}
