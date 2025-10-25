import { useState } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
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
    serial_number: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.employee_name || !formData.equipment_name || !formData.serial_number) {
      toast.error('Заполните все поля')
      return
    }

    setLoading(true)
    try {
      const result = await window.electronAPI.createRequest(formData)
      
      if (result.success) {
        toast.success('Заявка успешно создана')
        setFormData({ employee_name: '', equipment_name: '', serial_number: '' })
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
                id="employee_name"
                placeholder="Иванов Иван Иванович"
                value={formData.employee_name}
                onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="equipment_name">Название оборудования</Label>
              <Input
                id="equipment_name"
                placeholder="Ноутбук Dell Latitude"
                value={formData.equipment_name}
                onChange={(e) => setFormData({ ...formData, equipment_name: e.target.value })}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="serial_number">Серийный номер</Label>
              <Input
                id="serial_number"
                placeholder="SN123456789"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                disabled={loading}
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
