import { Settings, Database, Download, Upload } from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { toast } from 'sonner'

export function SettingsMenu() {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Настройки">
          <Settings className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Резервное копирование</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreateBackup}>
          <Download className="mr-2 h-4 w-4" />
          <span>Создать backup</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleRestoreBackup}>
          <Upload className="mr-2 h-4 w-4" />
          <span>Восстановить из backup</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Database className="mr-2 h-4 w-4" />
          <span className="text-xs text-muted-foreground">Auto-backup при закрытии</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
