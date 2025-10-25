import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { toast } from 'sonner'
import { Request } from '../types/electron.d'

interface EditRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestUpdated: () => void
  request: Request | null
}

export function EditRequestModal({ open, onOpenChange, onRequestUpdated, request }: EditRequestModalProps) {
  const [formData, setFormData] = useState({
    employee_name: '',
    equipment_name: '',
    serial_number: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({
    employee_name: false,
    equipment_name: false,
    serial_number: false
  })
  
  const firstInputRef = useRef<HTMLInputElement>(null)

  // Load request data when modal opens
  useEffect(() => {
    if (open && request) {
      setFormData({
        employee_name: request.employee_name,
        equipment_name: request.equipment_name,
        serial_number: request.serial_number
      })
      setErrors({ employee_name: false, equipment_name: false, serial_number: false })
      
      // Focus first field after a small delay to ensure modal is rendered
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
    }
  }, [open, request])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!request) return
    
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
      const result = await window.electronAPI.updateRequest(request.id, formData)
      
      if (result.success) {
        toast.success('Заявка успешно обновлена')
        onOpenChange(false)
        onRequestUpdated()
      } else {
        toast.error(result.error || 'Ошибка при обновлении заявки')
      }
    } catch (error) {
      toast.error('Произошла ошибка')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (!request) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактирование заявки #{request.id}</DialogTitle>
          <DialogDescription>
            Внесите изменения в информацию о заявке
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_employee_name">ФИО сотрудника</Label>
              <Input
                ref={firstInputRef}
                id="edit_employee_name"
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
              <Label htmlFor="edit_equipment_name">Название оборудования</Label>
              <Input
                id="edit_equipment_name"
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
              <Label htmlFor="edit_serial_number">Серийный номер</Label>
              <Input
                id="edit_serial_number"
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
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
