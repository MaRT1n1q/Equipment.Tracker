import { forwardRef } from 'react'
import { Plus, Trash2, Package } from 'lucide-react'
import type { EquipmentItem } from '../types/ipc'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'

const equipmentNamePlaceholder = 'Ноутбук Dell Latitude'
const serialPlaceholder = 'SN123456789'

interface RequestFormFieldsProps {
  employeeName: string
  onEmployeeNameChange: (value: string) => void
  employeeNameError: boolean
  login: string
  onLoginChange: (value: string) => void
  loginError: boolean
  notes: string
  onNotesChange: (value: string) => void
  equipmentItems: EquipmentItem[]
  onAddItem: () => void
  onRemoveItem: (index: number) => void
  onUpdateItem: (index: number, field: keyof EquipmentItem, value: string | number) => void
  disabled?: boolean
}

export const RequestFormFields = forwardRef<HTMLInputElement, RequestFormFieldsProps>(
  (
    {
      employeeName,
      onEmployeeNameChange,
      employeeNameError,
      login,
      onLoginChange,
      loginError,
      notes,
      onNotesChange,
      equipmentItems,
      onAddItem,
      onRemoveItem,
      onUpdateItem,
      disabled = false,
    },
    firstInputRef
  ) => {
    return (
      <div className="space-y-6">
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
              onChange={(event) => onEmployeeNameChange(event.target.value)}
              disabled={disabled}
              className={employeeNameError ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {employeeNameError && <p className="text-xs text-red-500">Это поле обязательно</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="employee_login">Логин сотрудника *</Label>
            <Input
              id="employee_login"
              placeholder="i.ivanov"
              value={login}
              onChange={(event) => onLoginChange(event.target.value)}
              disabled={disabled}
              className={loginError ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {loginError && <p className="text-xs text-red-500">Это поле обязательно</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Примечания</Label>
            <Textarea
              id="notes"
              placeholder="Дополнительная информация о заявке..."
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              disabled={disabled}
              rows={2}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Позиции оборудования</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddItem}
              disabled={disabled}
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
                      onClick={() => onRemoveItem(index)}
                      disabled={disabled}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Название оборудования *</Label>
                    <Input
                      placeholder={equipmentNamePlaceholder}
                      value={item.equipment_name}
                      onChange={(event) =>
                        onUpdateItem(index, 'equipment_name', event.target.value)
                      }
                      disabled={disabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Серийный номер *</Label>
                    <Input
                      placeholder={serialPlaceholder}
                      value={item.serial_number}
                      onChange={(event) => onUpdateItem(index, 'serial_number', event.target.value)}
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Количество</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) =>
                      onUpdateItem(index, 'quantity', Number(event.target.value) || 1)
                    }
                    disabled={disabled}
                    className="w-24"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
)

RequestFormFields.displayName = 'RequestFormFields'
