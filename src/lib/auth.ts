export interface AuthSession {
  userId: string
  login: string
  city: string
  role: string
  accessToken: string
  refreshToken: string
}

const AUTH_SESSION_STORAGE_KEY = 'equipment-tracker:auth-session'
const SAVED_CITY_KEY = 'equipment-tracker:saved-city'
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:9090'
const DEFAULT_AUTH_API_URL = `${API_BASE}/api/v1/auth/login`

function readStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

export function getAuthApiUrl(): string {
  const configured = import.meta.env.VITE_AUTH_API_URL
  if (configured?.trim().length) {
    return configured.trim()
  }

  return DEFAULT_AUTH_API_URL
}

export function getAuthSession(): AuthSession | null {
  const storage = readStorage()
  if (!storage) {
    return null
  }

  const raw = storage.getItem(AUTH_SESSION_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>
    if (!parsed.userId || !parsed.login || !parsed.accessToken || !parsed.refreshToken) {
      return null
    }

    // Если город не задан — сессия устарела (до внедрения city), сбрасываем
    if (!parsed.city) {
      return null
    }

    return {
      userId: parsed.userId,
      login: parsed.login,
      city: parsed.city,
      role: parsed.role ?? 'user',
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
    }
  } catch {
    return null
  }
}

export function saveAuthSession(session: AuthSession): void {
  const storage = readStorage()
  if (!storage) {
    return
  }

  storage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))
  storage.setItem(SAVED_CITY_KEY, session.city)
}

export function clearAuthSession(): void {
  const storage = readStorage()
  if (!storage) {
    return
  }

  storage.removeItem(AUTH_SESSION_STORAGE_KEY)
  // SAVED_CITY_KEY намеренно не удаляем — город запоминается для следующего входа
}

export function getSavedCity(): string | null {
  const storage = readStorage()
  if (!storage) return null
  return storage.getItem(SAVED_CITY_KEY) || null
}

export function setSavedCity(city: string): void {
  const storage = readStorage()
  if (!storage) return
  storage.setItem(SAVED_CITY_KEY, city)
}

export async function getCities(): Promise<string[]> {
  const url = `${API_BASE}/api/v1/cities`
  try {
    const response = await fetch(url)
    if (!response.ok) return []
    return (await response.json()) as string[]
  } catch {
    return []
  }
}

export async function loginByUserLogin(
  login: string,
  password: string,
  city: string
): Promise<AuthSession> {
  const normalizedLogin = login.trim()
  if (!normalizedLogin) {
    throw new Error('Логин обязателен')
  }

  if (password.trim().length < 8) {
    throw new Error('Пароль должен быть не меньше 8 символов')
  }

  const response = await fetch(getAuthApiUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ login: normalizedLogin, password, city }),
  })

  const payload = (await response.json()) as
    | {
        user_id?: string
        login?: string
        city?: string
        role?: string
        access_token?: string
        refresh_token?: string
        error?: string | { message?: string; code?: string }
      }
    | undefined

  if (!response.ok) {
    const errField = payload?.error
    const errMsg =
      typeof errField === 'string'
        ? errField
        : typeof errField === 'object' && errField?.message
          ? errField.message
          : 'Не удалось выполнить вход'
    throw new Error(errMsg)
  }

  if (!payload?.user_id || !payload.login || !payload.access_token || !payload.refresh_token) {
    throw new Error('Некорректный ответ сервера авторизации')
  }

  const session: AuthSession = {
    userId: payload.user_id,
    login: payload.login,
    city: payload.city ?? city,
    role: payload.role ?? 'user',
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
  }

  saveAuthSession(session)
  return session
}
