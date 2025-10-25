import { Settings, Database, Download, Upload, Info } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { toast } from 'sonner'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
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
            Equipment Tracker v1.0.0
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
