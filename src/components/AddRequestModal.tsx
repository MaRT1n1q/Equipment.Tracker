import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { toast } from 'sonner'

interface AddRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestAdded: () => void
}

export function AddRequestModal({ open, onOpenChange, onRequestAdded }: AddRequestModalProps) {
  const [formData, setFormData] = useState({
    employee_name: '',
    equipment_name: '',
    serial_number: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({
    employee_name: false,
    equipment_name: false,
    serial_number: false
  })
  
  const firstInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus first field when modal opens
  useEffect(() => {
    if (open) {
      // Clear form when opening
      setFormData({ employee_name: '', equipment_name: '', serial_number: '', notes: '' })
      setErrors({ employee_name: false, equipment_name: false, serial_number: false })
      
      // Focus first field after a small delay to ensure modal is rendered
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate fields
    const newErrors = {
      employee_name: !formData.employee_name.trim(),
      equipment_name: !formData.equipment_name.trim(),
      serial_number: !formData.serial_number.trim()
    }
    
    setErrors(newErrors)
    
    if (newErrors.employee_name || newErrors.equipment_name || newErrors.serial_number) {
      toast.error('Заполните все поля')
      return
    }

    setLoading(true)
    try {
      const result = await window.electronAPI.createRequest(formData)
      
      if (result.success) {
        toast.success('Заявка успешно создана')
        setFormData({ employee_name: '', equipment_name: '', serial_number: '', notes: '' })
        setErrors({ employee_name: false, equipment_name: false, serial_number: false })
        onOpenChange(false)
        onRequestAdded()
      } else {
        toast.error(result.error || 'Ошибка при создании заявки')
      }
    } catch (error) {
      toast.error('Произошла ошибка')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая заявка на выдачу оборудования</DialogTitle>
          <DialogDescription>
            Заполните информацию о сотруднике и оборудовании
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employee_name">ФИО сотрудника</Label>
              <Input
                ref={firstInputRef}
                id="employee_name"
                placeholder="Иванов Иван Иванович"
                value={formData.employee_name}
                onChange={(e) => {
                  setFormData({ ...formData, employee_name: e.target.value })
                  setErrors({ ...errors, employee_name: false })
                }}
                disabled={loading}
                className={errors.employee_name ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.employee_name && (
                <p className="text-xs text-red-500">Это поле обязательно</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="equipment_name">Название оборудования</Label>
              <Input
                id="equipment_name"
                placeholder="Ноутбук Dell Latitude"
                value={formData.equipment_name}
                onChange={(e) => {
                  setFormData({ ...formData, equipment_name: e.target.value })
                  setErrors({ ...errors, equipment_name: false })
                }}
                disabled={loading}
                className={errors.equipment_name ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.equipment_name && (
                <p className="text-xs text-red-500">Это поле обязательно</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="serial_number">Серийный номер</Label>
              <Input
                id="serial_number"
                placeholder="SN123456789"
                value={formData.serial_number}
                onChange={(e) => {
                  setFormData({ ...formData, serial_number: e.target.value })
                  setErrors({ ...errors, serial_number: false })
                }}
                disabled={loading}
                className={errors.serial_number ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.serial_number && (
                <p className="text-xs text-red-500">Это поле обязательно</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Примечания <span className="text-muted-foreground text-xs">(необязательно)</span></Label>
              <Textarea
                id="notes"
                placeholder="Дополнительная информация о заявке..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={loading}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Создание...' : 'Создать заявку'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
