import { Settings, Database, Download, Upload, Info } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { toast } from 'sonner'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Settings className="w-5 h-5 text-white" />
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
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-lg">Резервное копирование</h3>
            </div>

            <div className="grid gap-3">
              <Button
                onClick={handleCreateBackup}
                variant="outline"
                className="w-full justify-start h-auto py-3 hover:bg-accent hover:border-purple-500 transition-all group"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                    <Download className="w-5 h-5 text-green-600" />
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
                className="w-full justify-start h-auto py-3 hover:bg-accent hover:border-orange-500 transition-all group"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                    <Upload className="w-5 h-5 text-orange-600" />
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
          <div className="border-t pt-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
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
          <div className="text-center text-xs text-muted-foreground border-t pt-4">
            Equipment Tracker v1.0.0
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
