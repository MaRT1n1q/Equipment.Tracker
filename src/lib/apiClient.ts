/**
 * HTTP-клиент для работы с REST API бэкенда.
 *
 * Base URL определяется из VITE_API_BASE_URL (env) или 'http://localhost:9090'.
 * Автоматически добавляет Authorization header из session storage.
 * При 401 — пытается обновить access-токен через refresh; если refresh невалиден —
 * очищает сессию и генерирует событие 'auth:logout'.
 */

import { clearAuthSession, getAuthSession, saveAuthSession, type AuthSession } from './auth'

// Base URL для API.
// - VITE_API_BASE_URL задан → используем его (абсолютный URL, напр. https://api.koltakin.pro)
// - VITE_API_BASE_URL = "" (пустая строка) → same-origin, относительные пути (web-деплой за nginx proxy)
// - VITE_API_BASE_URL не задан (undefined) → fallback на localhost для dev
const VITE_API_BASE = import.meta.env.VITE_API_BASE_URL
const API_BASE =
  VITE_API_BASE !== undefined ? VITE_API_BASE.replace(/\/$/, '') : 'http://localhost:9090'

// ─── Типы ошибок ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ─── Вспомогательные функции ─────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const session = getAuthSession()
  if (!session?.accessToken) return {}
  return { Authorization: `Bearer ${session.accessToken}` }
}

// ─── Refresh token rotation ──────────────────────────────────────────────────
// Защита от гонок: если несколько запросов одновременно получили 401, refresh
// выполняется один раз, остальные ждут того же промиса.

let refreshPromise: Promise<AuthSession | null> | null = null

async function refreshSession(): Promise<AuthSession | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const session = getAuthSession()
    if (!session?.refreshToken) return null

    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      })

      if (!response.ok) return null

      const payload = (await response.json()) as {
        access_token?: string
        refresh_token?: string
      }
      if (!payload.access_token || !payload.refresh_token) return null

      const next: AuthSession = {
        ...session,
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token,
      }
      saveAuthSession(next)
      return next
    } catch {
      return null
    }
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

function forceLogout(): never {
  clearAuthSession()
  window.dispatchEvent(new Event('auth:logout'))
  throw new ApiError(401, 'UNAUTHORIZED', 'Сессия истекла, выполните вход заново')
}

async function handleResponse<T>(response: Response, retry?: () => Promise<T>): Promise<T> {
  // 401 — пытаемся обновить токен и повторить запрос один раз
  if (response.status === 401) {
    if (retry) {
      const refreshed = await refreshSession()
      if (!refreshed) return forceLogout()
      return retry()
    }
    return forceLogout()
  }
  if (!response.ok) {
    let code = 'UNKNOWN_ERROR'
    let message = `HTTP ${response.status}`
    let requestId: string | undefined
    try {
      const body = (await response.json()) as {
        error?: { code?: string; message?: string; request_id?: string }
      }
      if (body.error) {
        code = body.error.code || code
        message = body.error.message || message
        requestId = body.error.request_id
      }
    } catch {
      // тело не является JSON — используем значения по умолчанию
    }
    throw new ApiError(response.status, code, message, requestId)
  }
  // 204 No Content — нет тела
  if (response.status === 204) {
    return undefined as T
  }
  return response.json() as Promise<T>
}

// ─── Основные методы ─────────────────────────────────────────────────────────

export async function apiGet<T>(path: string): Promise<T> {
  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
    })
  return handleResponse<T>(await doFetch(), () => doFetch().then((r) => handleResponse<T>(r)))
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  return handleResponse<T>(await doFetch(), () => doFetch().then((r) => handleResponse<T>(r)))
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  return handleResponse<T>(await doFetch(), () => doFetch().then((r) => handleResponse<T>(r)))
}

export async function apiDelete<T>(path: string): Promise<T> {
  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
    })
  return handleResponse<T>(await doFetch(), () => doFetch().then((r) => handleResponse<T>(r)))
}

/**
 * Загружает файл(ы) через multipart/form-data.
 * Браузер сам устанавливает нужный Content-Type с boundary.
 */
export async function apiUpload<T>(
  path: string,
  files: File | File[],
  fieldName = 'file'
): Promise<T> {
  const buildForm = () => {
    const form = new FormData()
    const arr = Array.isArray(files) ? files : [files]
    for (const f of arr) {
      form.append(fieldName, f)
    }
    return form
  }
  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: authHeaders(),
      body: buildForm(),
    })
  return handleResponse<T>(await doFetch(), () => doFetch().then((r) => handleResponse<T>(r)))
}

/**
 * Скачивает бинарный файл и возвращает его как blob URL (для <a download> или <img src>).
 * Caller должен вызвать URL.revokeObjectURL() после использования.
 */
export async function apiFetchBlobUrl(path: string): Promise<string> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new ApiError(
      response.status,
      'FETCH_ERROR',
      `Не удалось загрузить файл: HTTP ${response.status}`
    )
  }
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

/**
 * Скачивает изображение и возвращает его как base64 data URL.
 * Используется для превью файлов, когда нужен data_url: string.
 */
export async function apiFetchDataUrl(path: string): Promise<string> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders(),
  })
  if (!response.ok) {
    throw new ApiError(
      response.status,
      'FETCH_ERROR',
      `Не удалось загрузить превью: HTTP ${response.status}`
    )
  }
  const blob = await response.blob()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Ошибка чтения файла'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Инициирует скачивание файла в браузере.
 */
export function downloadBlobUrl(blobUrl: string, filename: string): void {
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)
}

/**
 * Возвращает полный URL для прямых ссылок (скачивание/превью).
 */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}

export { API_BASE }
