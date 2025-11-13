import { Settings, Database, Download, Upload, Info, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

type UpdateState =
  | 'idle'
  | 'checking'
  | 'no-update'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'error'
  | 'installing'
  | 'manual-required'
  | 'manual-downloading'
  | 'manual-downloaded'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [appVersion, setAppVersion] = useState('loading...')
  const [updateState, setUpdateState] = useState<UpdateState>('idle')
  const [updateMessage, setUpdateMessage] = useState<string | null>(null)
  const [availableVersion, setAvailableVersion] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)
  const [isManualUpdateMode, setIsManualUpdateMode] = useState(false)
  const [manualDetail, setManualDetail] = useState<string | null>(null)
  const [manualDownloadPath, setManualDownloadPath] = useState<string | null>(null)

  useEffect(() => {
    if (window.electronAPI?.getAppVersion) {
      const version = window.electronAPI.getAppVersion()
      setAppVersion(version)
    } else {
      setAppVersion('unknown')
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
          setIsManualUpdateMode(false)
          setManualDetail(null)
          setManualDownloadPath(null)
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
          setIsManualUpdateMode(false)
          setManualDetail(null)
          setManualDownloadPath(null)
          break
        }
        case 'update-not-available':
          setUpdateState('no-update')
          setAvailableVersion(null)
          setDownloadProgress(null)
          setIsManualUpdateMode(false)
          setManualDetail(null)
          setManualDownloadPath(null)
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
          setIsManualUpdateMode(false)
          break
        }
        case 'download-started':
          setUpdateState('downloading')
          setDownloadProgress(0)
          setIsManualUpdateMode(false)
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
          setIsManualUpdateMode(false)
          break
        }
        case 'update-error':
          setUpdateState('error')
          setAvailableVersion(null)
          setDownloadProgress(null)
          setIsManualUpdateMode(false)
          break
        case 'manual-update-mode':
          setIsManualUpdateMode(true)
          setUpdateState('manual-required')
          setDownloadProgress(null)
          setManualDownloadPath(null)
          setManualDetail(null)
          break
        case 'manual-update-info': {
          setIsManualUpdateMode(true)
          const versionCandidate =
            data && typeof data.version === 'string'
              ? data.version
              : data && typeof data.version === 'number'
                ? String(data.version)
                : null
          const detailText = data && typeof data.detail === 'string' ? data.detail : null
          setAvailableVersion((prev) => versionCandidate ?? prev)
          setManualDetail(detailText)
          setManualDownloadPath((prev) => prev)
          setUpdateState((prev) => {
            if (prev === 'manual-downloading' || prev === 'manual-downloaded') {
              return prev
            }
            return 'manual-required'
          })
          break
        }
        case 'manual-download-started':
          setIsManualUpdateMode(true)
          setUpdateState('manual-downloading')
          setDownloadProgress(0)
          setManualDownloadPath(null)
          break
        case 'manual-download-progress': {
          setIsManualUpdateMode(true)
          setUpdateState('manual-downloading')
          let percentValue: number | null = null
          if (data) {
            if (typeof data.percent === 'number') {
              percentValue = Math.round(data.percent)
            } else if (typeof data.percent === 'string') {
              const parsed = Number(data.percent)
              percentValue = Number.isFinite(parsed) ? Math.round(parsed) : null
            }
          }
          setDownloadProgress(percentValue)
          break
        }
        case 'manual-download-complete': {
          setIsManualUpdateMode(true)
          setUpdateState('manual-downloaded')
          setDownloadProgress(100)
          const pathValue = data && typeof data.path === 'string' ? data.path : null
          const versionCandidate =
            data && typeof data.version === 'string'
              ? data.version
              : data && typeof data.version === 'number'
                ? String(data.version)
                : null
          setManualDownloadPath(pathValue)
          setAvailableVersion((prev) => versionCandidate ?? prev)
          break
        }
        case 'manual-download-error':
          setIsManualUpdateMode(true)
          setUpdateState('error')
          setDownloadProgress(null)
          setManualDownloadPath(null)
          break
        case 'manual-download-warning':
          toast.warning(payload.message)
          break
        case 'manual-download-quarantine-removed':
          toast.success(payload.message)
          break
        case 'manual-install-opened':
          toast.success(payload.message)
          break
        case 'manual-install-open-failed':
          toast.warning(payload.message)
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

  const handleCreateBackup = async () => {
    try {
      const result = await window.electronAPI.createBackup()
      if (result.success) {
        toast.success('Резервная копия создана успешно')
      } else {
        toast.error(result.error || 'Ошибка при создании backup')
      }
    } catch (error) {
      toast.error('Произошла ошибка')
      console.error(error)
    }
  }

  const handleRestoreBackup = async () => {
    if (!confirm('Восстановление заменит текущие данные. Продолжить?')) {
      return
    }

    try {
      const result = await window.electronAPI.restoreBackup()
      if (result.success) {
        toast.success('Данные успешно восстановлены. Перезагрузите приложение.')
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else if (result.error !== 'Отменено пользователем') {
        toast.error(result.error || 'Ошибка при восстановлении')
      }
    } catch (error) {
      toast.error('Произошла ошибка')
      console.error(error)
    }
  }

  const manualDownloadReady =
    isManualUpdateMode && updateState === 'manual-downloaded' && Boolean(manualDownloadPath)
  const isActiveProcess =
    updateState === 'checking' ||
    updateState === 'downloading' ||
    updateState === 'installing' ||
    updateState === 'manual-downloading'
  const shouldAnimateUpdateIcon = isActiveProcess
  const updateButtonLabel = (() => {
    if (isManualUpdateMode) {
      if (updateState === 'manual-downloading') {
        return 'Загрузка обновления...'
      }
      if (manualDownloadReady) {
        return 'Открыть установщик'
      }
      return 'Скачать обновление'
    }

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
    if (isManualUpdateMode) {
      if (updateState === 'manual-downloading') {
        if (updateMessage) {
          return updateMessage
        }
        if (downloadProgress !== null) {
          return `Загрузка установщика${availableVersion ? ` v${availableVersion}` : ''}: ${downloadProgress}%`
        }
        return 'Загрузка установщика...'
      }

      if (updateState === 'manual-downloaded') {
        return (
          updateMessage ||
          `Установщик${availableVersion ? ` v${availableVersion}` : ''} скачан. Откройте файл для обновления.`
        )
      }

      return (
        updateMessage ||
        manualDetail ||
        (availableVersion
          ? `Доступна новая версия v${availableVersion}. Скачайте установщик вручную.`
          : null) ||
        'Автообновление отключено. Скачайте установщик вручную и запустите его.'
      )
    }

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
    if (isManualUpdateMode) {
      if (
        !window.electronAPI?.downloadManualUpdate ||
        !window.electronAPI?.openManualUpdateLocation
      ) {
        toast.error('Функция обновления недоступна')
        return
      }

      if (updateState === 'manual-downloading') {
        toast.info('Загрузка обновления уже выполняется')
        return
      }

      if (manualDownloadReady) {
        try {
          const result = await window.electronAPI.openManualUpdateLocation()
          if (!result.success) {
            const message =
              result.error || 'Не удалось открыть папку с установщиком. Откройте её вручную.'
            setUpdateMessage(message)
            toast.error(message)
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Не удалось открыть папку с установщиком. Попробуйте вручную.'
          setUpdateMessage(message)
          toast.error(message)
        }
        return
      }

      try {
        setIsManualUpdateMode(true)
        setUpdateState('manual-downloading')
        setUpdateMessage('Загрузка установщика...')
        setDownloadProgress(0)
        setManualDownloadPath(null)
        const result = await window.electronAPI.downloadManualUpdate()
        if (!result.success) {
          const message = result.error || 'Не удалось скачать обновление. Повторите попытку позже.'
          setUpdateState('error')
          setUpdateMessage(message)
          toast.error(message)
        } else {
          const downloadedPath =
            result.data && typeof result.data.path === 'string' ? result.data.path : null
          if (downloadedPath) {
            setManualDownloadPath(downloadedPath)
          }
          toast.success('Установщик скачан. Проверьте папку загрузок.')
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Не удалось скачать обновление'
        setUpdateState('error')
        setUpdateMessage(message)
        toast.error(message)
      }

      return
    }

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
                Управление резервными копиями и настройками приложения
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Backup Section */}
          <div className="surface-section space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[hsl(var(--primary))]" />
              <h3 className="font-semibold text-base">Резервное копирование</h3>
            </div>

            <div className="grid gap-3">
              <Button
                onClick={handleCreateBackup}
                variant="outline"
                className="w-full justify-start h-auto py-3 hover:bg-muted/40 transition-colors group"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className={`${iconVariants.success} w-10 h-10`}>
                    <Download className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Создать резервную копию</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Сохранить текущую базу данных
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                onClick={handleRestoreBackup}
                variant="outline"
                className="w-full justify-start h-auto py-3 hover:bg-muted/40 transition-colors group"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className={`${iconVariants.danger} w-10 h-10`}>
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Восстановить из резервной копии</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Заменить данные из файла backup
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          </div>

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
                  updateState === 'installing' ||
                  updateState === 'manual-downloading'
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

          {/* Info Section */}
          <div className="surface-section space-y-3">
            <div className="flex items-start gap-3">
              <div className={`${iconVariants.info} w-10 h-10`}>
                <Info className="w-5 h-5" />
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">
                  Автоматическое резервное копирование
                </p>
                <p className="text-xs">
                  Резервная копия автоматически создаётся при закрытии приложения
                </p>
              </div>
            </div>
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
