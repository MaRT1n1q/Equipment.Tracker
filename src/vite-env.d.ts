/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string

  /** Base URL REST API бэкенда без trailing slash, напр. http://localhost:9090 */
  readonly VITE_API_BASE_URL?: string

  /** Полный URL эндпоинта логина (переопределяет дефолтный ${VITE_API_BASE_URL}/api/v1/auth/login) */
  readonly VITE_AUTH_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
