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
import type { Request, EquipmentItem } from '../types/ipc'
import { useRequestActions } from '../hooks/useRequests'

interface EditRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: Request | null
}

export function EditRequestModal({ open, onOpenChange, request }: EditRequestModalProps) {
  const [employeeName, setEmployeeName] = useState('')
  const [notes, setNotes] = useState('')
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([
    { equipment_name: '', serial_number: '', quantity: 1 },
  ])
  const [loading, setLoading] = useState(false)
  const [employeeNameError, setEmployeeNameError] = useState(false)

  const firstInputRef = useRef<HTMLInputElement>(null)
  const { updateRequest } = useRequestActions()

  // Load request data when modal opens
  useEffect(() => {
    if (open && request) {
      setEmployeeName(request.employee_name)
      setNotes(request.notes || '')
      setEquipmentItems(
        request.equipment_items && request.equipment_items.length > 0
          ? request.equipment_items.map((item) => ({ ...item }))
          : [{ equipment_name: '', serial_number: '', quantity: 1 }]
      )
      setEmployeeNameError(false)

      // Focus first field after a small delay
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
    }
  }, [open, request])

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

    if (!request) return

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
      await updateRequest({
        id: request.id,
        data: {
          employee_name: employeeName,
          notes: notes || undefined,
          equipment_items: equipmentItems,
        },
      })

      toast.success('Заявка успешно обновлена')
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Произошла ошибка'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (!request) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактирование заявки #{request.id}</DialogTitle>
          <DialogDescription>Внесите изменения в информацию о заявке</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Package className="w-4 h-4" />
                Информация о сотруднике
              </h3>

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
                  <div key={index} className="p-4 border rounded-lg bg-card space-y-3">
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
