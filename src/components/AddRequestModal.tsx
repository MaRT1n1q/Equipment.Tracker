import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { toast } from 'sonner'
import { Plus, Trash2, Package } from 'lucide-react'
import type { EquipmentItem } from '../types/ipc'
import { useRequestActions } from '../hooks/useRequests'

interface AddRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddRequestModal({ open, onOpenChange }: AddRequestModalProps) {
  const [employeeName, setEmployeeName] = useState('')
  const [notes, setNotes] = useState('')
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([
    { equipment_name: '', serial_number: '', quantity: 1 },
  ])
  const [loading, setLoading] = useState(false)
  const [employeeNameError, setEmployeeNameError] = useState(false)

  const firstInputRef = useRef<HTMLInputElement>(null)
  const { createRequest } = useRequestActions()

  // Auto-focus first field when modal opens
  useEffect(() => {
    if (open) {
      // Clear form when opening
      setEmployeeName('')
      setNotes('')
      setEquipmentItems([{ equipment_name: '', serial_number: '', quantity: 1 }])
      setEmployeeNameError(false)

      // Focus first field after a small delay
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  const addEquipmentItem = () => {
    setEquipmentItems([...equipmentItems, { equipment_name: '', serial_number: '', quantity: 1 }])
  }

  const removeEquipmentItem = (index: number) => {
    if (equipmentItems.length > 1) {
      setEquipmentItems(equipmentItems.filter((_, i) => i !== index))
    }
  }

  const updateEquipmentItem = (
    index: number,
    field: keyof EquipmentItem,
    value: string | number
  ) => {
    const updated = [...equipmentItems]
    updated[index] = { ...updated[index], [field]: value }
    setEquipmentItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate employee name
    if (!employeeName.trim()) {
      setEmployeeNameError(true)
      toast.error('Укажите ФИО сотрудника')
      return
    }

    // Validate equipment items
    const hasEmptyFields = equipmentItems.some(
      (item) => !item.equipment_name.trim() || !item.serial_number.trim()
    )

    if (hasEmptyFields) {
      toast.error('Заполните все поля оборудования')
      return
    }

    setLoading(true)
    try {
      await createRequest({
        employee_name: employeeName,
        notes: notes || undefined,
        equipment_items: equipmentItems,
      })

      toast.success('Заявка успешно создана')
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Произошла ошибка'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новая заявка на выдачу оборудования</DialogTitle>
          <DialogDescription>Укажите сотрудника и добавьте позиции оборудования</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="surface-section space-y-4">
              <div className="flex items-center gap-3">
                <div className="icon-bubble icon-bubble--soft w-9 h-9">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Информация о сотруднике</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee_name">ФИО сотрудника *</Label>
                <Input
                  ref={firstInputRef}
                  id="employee_name"
                  placeholder="Иванов Иван Иванович"
                  value={employeeName}
                  onChange={(e) => {
                    setEmployeeName(e.target.value)
                    setEmployeeNameError(false)
                  }}
                  disabled={loading}
                  className={employeeNameError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {employeeNameError && <p className="text-xs text-red-500">Это поле обязательно</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Примечания</Label>
                <Textarea
                  id="notes"
                  placeholder="Дополнительная информация о заявке..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={loading}
                  rows={2}
                />
              </div>
            </div>

            {/* Equipment Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Позиции оборудования</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEquipmentItem}
                  disabled={loading}
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
                          disabled={loading}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Название оборудования *</Label>
                        <Input
                          placeholder="Ноутбук Dell Latitude"
                          value={item.equipment_name}
                          onChange={(e) =>
                            updateEquipmentItem(index, 'equipment_name', e.target.value)
                          }
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Серийный номер *</Label>
                        <Input
                          placeholder="SN123456789"
                          value={item.serial_number}
                          onChange={(e) =>
                            updateEquipmentItem(index, 'serial_number', e.target.value)
                          }
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Количество</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateEquipmentItem(index, 'quantity', parseInt(e.target.value) || 1)
                        }
                        disabled={loading}
                        className="w-24"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading} className="shadow-brand">
              {loading ? 'Создание...' : 'Создать заявку'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
