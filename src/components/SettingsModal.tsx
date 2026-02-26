import { Settings, RefreshCw, LogOut, UserRound } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { type AuthSession } from '../lib/auth'

type UpdateState =
  | 'idle'
  | 'checking'
  | 'no-update'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'error'
  | 'installing'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  authSession: AuthSession
  onLogout: () => void
}

export function SettingsModal({ isOpen, onClose, authSession, onLogout }: SettingsModalProps) {
  const [appVersion, setAppVersion] = useState('loading...')
  const [updateState, setUpdateState] = useState<UpdateState>('idle')
  const [updateMessage, setUpdateMessage] = useState<string | null>(null)
  const [availableVersion, setAvailableVersion] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)

  useEffect(() => {
    if (window.electronAPI?.getAppVersion) {
      const version = window.electronAPI.getAppVersion()
      setAppVersion(version)
    } else {
      setAppVersion(typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown')
    }
  }, [])

  useEffect(() => {
    if (!window.electronAPI?.onUpdateStatus) {
      return
    }

    const unsubscribe = window.electronAPI.onUpdateStatus((payload) => {
      const data = payload.data as
        | {
            version?: unknown
            percent?: unknown
            transferred?: unknown
            total?: unknown
            detail?: unknown
            path?: unknown
          }
        | undefined

      setUpdateMessage(payload.message)

      switch (payload.event) {
        case 'checking-for-update':
          setUpdateState('checking')
          setAvailableVersion(null)
          setDownloadProgress(null)
          break
        case 'update-available': {
          const versionCandidate =
            data && typeof data.version === 'string'
              ? data.version
              : data && typeof data.version === 'number'
                ? String(data.version)
                : null
          setUpdateState('available')
          setAvailableVersion(versionCandidate)
          setDownloadProgress(null)
          break
        }
        case 'update-not-available':
          setUpdateState('no-update')
          setAvailableVersion(null)
          setDownloadProgress(null)
          break
        case 'download-progress': {
          let percentValue: number | null = null
          if (data) {
            if (typeof data.percent === 'number') {
              percentValue = Math.round(data.percent)
            } else if (typeof data.percent === 'string') {
              const parsed = Number(data.percent)
              percentValue = Number.isFinite(parsed) ? Math.round(parsed) : null
            }
          }
          setUpdateState('downloading')
          setDownloadProgress(percentValue)
          break
        }
        case 'download-started':
          setUpdateState('downloading')
          setDownloadProgress(0)
          break
        case 'update-downloaded': {
          const versionCandidate =
            data && typeof data.version === 'string'
              ? data.version
              : data && typeof data.version === 'number'
                ? String(data.version)
                : null
          setUpdateState('downloaded')
          setAvailableVersion((prev) => versionCandidate ?? prev)
          setDownloadProgress(100)
          break
        }
        case 'update-error':
          setUpdateState('error')
          setAvailableVersion(null)
          setDownloadProgress(null)
          break
        default:
          break
      }
    })

    return () => {
      unsubscribe?.()
    }
  }, [])
  const iconVariants = {
    success: 'status-icon status-icon--success',
    danger: 'status-icon status-icon--danger',
    info: 'status-icon status-icon--info',
  } as const

  const isActiveProcess =
    updateState === 'checking' || updateState === 'downloading' || updateState === 'installing'
  const shouldAnimateUpdateIcon = isActiveProcess
  const updateButtonLabel = (() => {
    if (updateState === 'checking') {
      return 'Проверяем обновления...'
    }
    if (updateState === 'available') {
      return 'Скачать обновление'
    }
    if (updateState === 'downloading') {
      return 'Загрузка обновления...'
    }
    if (updateState === 'installing') {
      return 'Установка обновления...'
    }
    if (updateState === 'downloaded') {
      return 'Установить обновление'
    }

    return 'Проверить обновления'
  })()
  const updateDescription = (() => {
    if (updateState === 'checking') {
      return updateMessage || 'Выполняется проверка обновлений...'
    }
    if (updateState === 'available') {
      return (
        updateMessage ||
        `Доступна новая версия${availableVersion ? ` v${availableVersion}` : ''}. Скачайте и установите её, когда будете готовы.`
      )
    }
    if (updateState === 'downloading') {
      if (updateMessage) {
        return updateMessage
      }
      if (downloadProgress !== null) {
        return `Загрузка обновления${availableVersion ? ` v${availableVersion}` : ''}: ${downloadProgress}%`
      }
      return updateMessage || 'Загрузка обновления...'
    }
    if (updateState === 'downloaded') {
      return updateMessage || 'Обновление готово к установке'
    }
    if (updateState === 'no-update') {
      return updateMessage || 'Новых обновлений не найдено'
    }
    if (updateState === 'error') {
      return updateMessage || 'Не удалось проверить обновления'
    }
    if (updateState === 'installing') {
      return updateMessage || 'Устанавливаем обновление...'
    }
    return updateMessage || 'Проверить наличие новой версии приложения'
  })()
  const updateDescriptionClass =
    updateState === 'error' ? 'text-destructive' : 'text-muted-foreground'

  const handleUpdateAction = async () => {
    if (!window.electronAPI?.checkForUpdates || !window.electronAPI?.downloadUpdate) {
      toast.error('Функция обновления недоступна')
      return
    }

    if (updateState === 'available') {
      try {
        setUpdateState('downloading')
        setUpdateMessage('Загрузка обновления...')
        setDownloadProgress(0)
        const result = await window.electronAPI.downloadUpdate()
        if (!result.success) {
          const message = result.error || 'Не удалось скачать обновление'
          setUpdateState('error')
          setUpdateMessage(message)
          toast.error(message)
        } else {
          toast.success('Обновление загружено. Можно установить обновление.')
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось скачать обновление'
        setUpdateState('error')
        setUpdateMessage(message)
        toast.error(message)
      }
      return
    }

    if (updateState === 'downloading') {
      toast.info('Загрузка обновления уже выполняется')
      return
    }

    if (updateState === 'downloaded') {
      try {
        setUpdateState('installing')
        setUpdateMessage('Установка обновления...')
        const result = await window.electronAPI.installUpdate()
        if (!result.success) {
          const message = result.error || 'Не удалось установить обновление'
          setUpdateState('error')
          setUpdateMessage(message)
          toast.error(message)
        } else {
          toast.success('Приложение перезапустится для установки обновления')
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось установить обновление'
        setUpdateState('error')
        setUpdateMessage(message)
        toast.error(message)
      }

      return
    }

    if (updateState === 'installing') {
      toast.info('Установка уже выполняется')
      return
    }

    if (updateState === 'checking') {
      toast.info('Проверка обновлений уже выполняется')
      return
    }

    try {
      setUpdateState('checking')
      setUpdateMessage('Проверка обновлений...')
      setAvailableVersion(null)
      setDownloadProgress(null)
      const result = await window.electronAPI.checkForUpdates()
      if (!result.success) {
        const message =
          result.error || 'Не удалось выполнить проверку обновлений. Повторите попытку позже.'
        setUpdateState('error')
        setUpdateMessage(message)
        toast.error(message)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Не удалось выполнить проверку обновлений'
      setUpdateState('error')
      setUpdateMessage(message)
      toast.error(message)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="icon-bubble w-10 h-10">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Настройки</DialogTitle>
              <DialogDescription>
                Управление обновлениями и настройками приложения
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Update Section */}
          <div className="surface-section space-y-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[hsl(var(--primary))]" />
              <h3 className="font-semibold text-base">Обновление приложения</h3>
            </div>

            <div className="grid gap-3">
              <Button
                onClick={handleUpdateAction}
                variant="outline"
                className="w-full justify-start h-auto py-3 hover:bg-muted/40 transition-colors group"
                disabled={
                  updateState === 'checking' ||
                  updateState === 'downloading' ||
                  updateState === 'installing'
                }
              >
                <div className="flex items-start gap-3 w-full">
                  <div className={`${iconVariants.info} w-10 h-10`}>
                    <RefreshCw
                      className={`w-5 h-5 ${shouldAnimateUpdateIcon ? 'animate-spin' : ''}`}
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{updateButtonLabel}</div>
                    <div
                      className={`text-xs mt-1 ${updateDescriptionClass} whitespace-normal break-words text-pretty`}
                    >
                      {updateDescription}
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </div>

          <div className="surface-section space-y-4">
            <div className="flex items-center gap-2">
              <UserRound className="w-5 h-5 text-[hsl(var(--primary))]" />
              <h3 className="font-semibold text-base">Аккаунт</h3>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/50 p-3 text-sm space-y-2">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Логин</span>
                <span className="font-medium text-right break-all">{authSession.login}</span>
              </div>
            </div>

            <Button
              onClick={() => {
                onClose()
                onLogout()
              }}
              variant="outline"
              className="w-full justify-start h-auto py-3 hover:bg-muted/40 transition-colors group"
            >
              <div className="flex items-start gap-3 w-full">
                <div className={`${iconVariants.danger} w-10 h-10`}>
                  <LogOut className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">Выйти из аккаунта</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Завершить текущую авторизацию
                  </div>
                </div>
              </div>
            </Button>
          </div>

          {/* Version info */}
          <div className="text-center text-xs text-muted-foreground border-t border-border/60 pt-4">
            Equipment Tracker v{appVersion}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
