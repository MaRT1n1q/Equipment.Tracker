import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { toast } from 'sonner'
import { UserMinus } from 'lucide-react'
import { useEmployeeExitActions } from '../hooks/useEmployeeExits'

interface AddEmployeeExitModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AddEmployeeExitModal({ isOpen, onClose }: AddEmployeeExitModalProps) {
  const [employeeName, setEmployeeName] = useState('')
  const [login, setLogin] = useState('')
  const [exitDate, setExitDate] = useState('')
  const [equipmentList, setEquipmentList] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createEmployeeExit } = useEmployeeExitActions()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!employeeName.trim() || !login.trim() || !exitDate || !equipmentList.trim()) {
      toast.error('Пожалуйста, заполните все поля')
      return
    }

    setIsSubmitting(true)

    try {
      await createEmployeeExit({
        employee_name: employeeName.trim(),
        login: login.trim(),
        exit_date: exitDate,
        equipment_list: equipmentList.trim()
      })

      toast.success('Запись о выходе сотрудника создана')
      setEmployeeName('')
      setLogin('')
      setExitDate('')
      setEquipmentList('')
      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Произошла ошибка'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setEmployeeName('')
      setLogin('')
      setExitDate('')
      setEquipmentList('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
              <UserMinus className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Новая запись выхода</DialogTitle>
              <DialogDescription>
                Создайте запись о выходе сотрудника и необходимом оборудовании
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Employee Name */}
          <div className="space-y-2">
            <Label htmlFor="employee-name" className="text-sm font-medium">
              ФИО сотрудника <span className="text-red-500">*</span>
            </Label>
            <Input
              id="employee-name"
              placeholder="Иванов Иван Иванович"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="w-full"
              disabled={isSubmitting}
            />
          </div>

          {/* Login */}
          <div className="space-y-2">
            <Label htmlFor="login" className="text-sm font-medium">
              Логин <span className="text-red-500">*</span>
            </Label>
            <Input
              id="login"
              placeholder="i.ivanov"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full"
              disabled={isSubmitting}
            />
          </div>

          {/* Exit Date */}
          <div className="space-y-2">
            <Label htmlFor="exit-date" className="text-sm font-medium">
              Дата выхода <span className="text-red-500">*</span>
            </Label>
            <Input
              id="exit-date"
              type="date"
              value={exitDate}
              onChange={(e) => setExitDate(e.target.value)}
              className="w-full"
              disabled={isSubmitting}
            />
          </div>

          {/* Equipment List */}
          <div className="space-y-2">
            <Label htmlFor="equipment-list" className="text-sm font-medium">
              Список оборудования для выдачи <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="equipment-list"
              placeholder="Ноутбук Dell XPS 15&#10;Мышь Logitech MX Master&#10;Клавиатура Keychron K2&#10;Монитор LG 27''"
              value={equipmentList}
              onChange={(e) => setEquipmentList(e.target.value)}
              className="w-full min-h-[120px] resize-y"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Укажите каждую позицию оборудования с новой строки
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isSubmitting ? 'Создание...' : 'Создать запись'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
