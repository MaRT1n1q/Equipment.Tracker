import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { toast } from 'sonner'
import { Package, Plus, Trash2, UserMinus } from 'lucide-react'
import { useEmployeeExitActions } from '../hooks/useEmployeeExits'
import {
  createEmptyExitEquipmentItem,
  formatExitEquipmentList,
  type ExitEquipmentItem,
} from '../lib/employeeExitEquipment'
import { usePersistentState } from '../hooks/usePersistentState'

interface AddEmployeeExitModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ExitFormDraft {
  employeeName: string
  login: string
  sdNumber: string
  exitDate: string
  equipmentItems: ExitEquipmentItem[]
}

const createExitDraft = (): ExitFormDraft => ({
  employeeName: '',
  login: '',
  sdNumber: '',
  exitDate: '',
  equipmentItems: [createEmptyExitEquipmentItem()],
})

export function AddEmployeeExitModal({ isOpen, onClose }: AddEmployeeExitModalProps) {
  const initialDraft = useMemo(createExitDraft, [])
  const [formDraft, setFormDraft] = usePersistentState<ExitFormDraft>(
    'equipment-tracker:add-exit-draft',
    initialDraft,
    {
      deserializer: (value) => {
        try {
          const parsed = JSON.parse(value) as ExitFormDraft
          return {
            ...parsed,
            equipmentItems:
              parsed.equipmentItems && parsed.equipmentItems.length > 0
                ? parsed.equipmentItems.map((item) => ({ ...item }))
                : [createEmptyExitEquipmentItem()],
          }
        } catch (error) {
          console.warn('Failed to deserialize employee exit draft', error)
          return createExitDraft()
        }
      },
    }
  )
  const { employeeName, login, sdNumber, exitDate, equipmentItems } = formDraft
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { createEmployeeExit } = useEmployeeExitActions()

  const updateDraft = <K extends keyof ExitFormDraft>(key: K, value: ExitFormDraft[K]) => {
    setFormDraft((draft) => ({ ...draft, [key]: value }))
  }

  const setEmployeeName = (value: string) => updateDraft('employeeName', value)
  const setLogin = (value: string) => updateDraft('login', value)
  const setSdNumber = (value: string) => updateDraft('sdNumber', value)
  const setExitDate = (value: string) => updateDraft('exitDate', value)

  const resetForm = () => {
    setFormDraft(createExitDraft())
  }

  const addEquipmentItem = () => {
    setFormDraft((draft) => ({
      ...draft,
      equipmentItems: [...draft.equipmentItems, createEmptyExitEquipmentItem()],
    }))
  }

  const removeEquipmentItem = (index: number) => {
    setFormDraft((draft) => {
      if (draft.equipmentItems.length <= 1) {
        return draft
      }

      return {
        ...draft,
        equipmentItems: draft.equipmentItems.filter((_, i) => i !== index),
      }
    })
  }

  const updateEquipmentItem = (index: number, field: keyof ExitEquipmentItem, value: string) => {
    setFormDraft((draft) => ({
      ...draft,
      equipmentItems: draft.equipmentItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const preparedItems = equipmentItems.map((item) => ({
      name: item.name.trim(),
      serial: item.serial.trim(),
    }))
    const validItems = preparedItems.filter((item) => item.name && item.serial)

    if (!employeeName.trim() || !login.trim() || !exitDate) {
      toast.error('Пожалуйста, заполните обязательные поля')
      return
    }

    if (validItems.length === 0) {
      toast.error('Добавьте хотя бы одну позицию оборудования')
      return
    }

    if (validItems.length !== preparedItems.length) {
      toast.error('Укажите название и серийный номер для каждого оборудования')
      return
    }

    const serializedList = formatExitEquipmentList(validItems)

    setIsSubmitting(true)

    try {
      await createEmployeeExit({
        employee_name: employeeName.trim(),
        login: login.trim(),
        sd_number: sdNumber.trim() ? sdNumber.trim() : undefined,
        exit_date: exitDate,
        equipment_list: serializedList,
      })

      toast.success('Запись о выходе сотрудника создана')
      resetForm()
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

    resetForm()
    onClose()
  }

  const handleDialogChange = (nextOpen: boolean) => {
    if (nextOpen) {
      return
    }

    if (isSubmitting) {
      return
    }

    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="icon-bubble w-12 h-12">
              <UserMinus className="w-6 h-6" />
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
          <div className="surface-section space-y-4">
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

            {/* SD Number */}
            <div className="space-y-2">
              <Label htmlFor="sd-number" className="text-sm font-medium">
                Номер SD
              </Label>
              <Input
                id="sd-number"
                placeholder="12345678"
                value={sdNumber}
                onChange={(e) => setSdNumber(e.target.value)}
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="icon-bubble icon-bubble--soft w-9 h-9">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      Оборудование для выдачи
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Укажите название и серийный номер каждой позиции
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEquipmentItem}
                  disabled={isSubmitting}
                  className="h-8"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Добавить позицию
                </Button>
              </div>

              <div className="space-y-3">
                {equipmentItems.map((item, index) => (
                  <div key={index} className="surface-section space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Позиция #{index + 1}
                      </span>
                      {equipmentItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEquipmentItem(index)}
                          disabled={isSubmitting}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          aria-label={`Удалить позицию ${index + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Наименование *</Label>
                        <Input
                          placeholder="Ноутбук Dell Latitude"
                          value={item.name}
                          onChange={(e) => updateEquipmentItem(index, 'name', e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Серийный номер *</Label>
                        <Input
                          placeholder="SN123456789"
                          value={item.serial}
                          onChange={(e) => updateEquipmentItem(index, 'serial', e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
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
              {isSubmitting ? 'Создание...' : 'Создать запись'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
