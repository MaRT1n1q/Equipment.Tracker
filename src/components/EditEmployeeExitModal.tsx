import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { toast } from 'sonner'
import { UserMinus } from 'lucide-react'
import { useEmployeeExitActions } from '../hooks/useEmployeeExits'
import type { EmployeeExit } from '../types/ipc'

interface EditEmployeeExitModalProps {
  exit: EmployeeExit | null
  isOpen: boolean
  onClose: () => void
}

export function EditEmployeeExitModal({ exit, isOpen, onClose }: EditEmployeeExitModalProps) {
  const [employeeName, setEmployeeName] = useState('')
  const [login, setLogin] = useState('')
  const [sdNumber, setSdNumber] = useState('')
  const [exitDate, setExitDate] = useState('')
  const [equipmentList, setEquipmentList] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateEmployeeExit } = useEmployeeExitActions()

  useEffect(() => {
    if (exit && isOpen) {
      setEmployeeName(exit.employee_name)
      setLogin(exit.login)
      setSdNumber(exit.sd_number ?? '')
      setExitDate(exit.exit_date)
      setEquipmentList(exit.equipment_list)
    }
  }, [exit, isOpen])

  if (!exit) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!employeeName.trim() || !login.trim() || !exitDate || !equipmentList.trim()) {
      toast.error('Пожалуйста, заполните все поля')
      return
    }

    setIsSubmitting(true)

    try {
      await updateEmployeeExit({
        id: exit.id,
        data: {
          employee_name: employeeName.trim(),
          login: login.trim(),
          sd_number: sdNumber.trim() ? sdNumber.trim() : undefined,
          exit_date: exitDate,
          equipment_list: equipmentList.trim(),
        },
      })

      toast.success('Запись о выходе обновлена')
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Произошла ошибка'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) {
      return
    }

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="icon-bubble w-12 h-12">
              <UserMinus className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Редактирование записи выхода</DialogTitle>
              <DialogDescription>
                Обновите данные сотрудника и список оборудования перед финализацией выдачи
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="surface-section space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee-name-edit" className="text-sm font-medium">
                ФИО сотрудника <span className="text-red-500">*</span>
              </Label>
              <Input
                id="employee-name-edit"
                placeholder="Иванов Иван Иванович"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-edit" className="text-sm font-medium">
                Логин <span className="text-red-500">*</span>
              </Label>
              <Input
                id="login-edit"
                placeholder="i.ivanov"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sd-number-edit" className="text-sm font-medium">
                Номер SD
              </Label>
              <Input
                id="sd-number-edit"
                placeholder="12345678"
                value={sdNumber}
                onChange={(e) => setSdNumber(e.target.value)}
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exit-date-edit" className="text-sm font-medium">
                Дата выхода <span className="text-red-500">*</span>
              </Label>
              <Input
                id="exit-date-edit"
                type="date"
                value={exitDate}
                onChange={(e) => setExitDate(e.target.value)}
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment-list-edit" className="text-sm font-medium">
                Список оборудования для выдачи <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="equipment-list-edit"
                placeholder={
                  'Ноутбук Dell XPS 15\nМышь Logitech MX Master\nКлавиатура Keychron K2\nМонитор LG 27"'
                }
                value={equipmentList}
                onChange={(e) => setEquipmentList(e.target.value)}
                className="w-full min-h-[120px] resize-y"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Укажите каждую позицию оборудования с новой строки
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 shadow-brand">
              {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
