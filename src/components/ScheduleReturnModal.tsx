import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'
import { Label } from './ui/label'
import type { Request } from '../types/ipc'
import { useRequestActions } from '../hooks/useRequests'
import { toast } from 'sonner'

interface ScheduleReturnModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: Request | null
}

export function ScheduleReturnModal({ open, onOpenChange, request }: ScheduleReturnModalProps) {
  const { scheduleReturn } = useRequestActions()
  const [dueDate, setDueDate] = useState('')
  const [equipment, setEquipment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fallbackEquipment = useMemo(() => {
    if (!request) {
      return ''
    }

    if (request.return_equipment && request.return_equipment.trim().length > 0) {
      return request.return_equipment
    }

    if (!request.equipment_items || request.equipment_items.length === 0) {
      return ''
    }

    return request.equipment_items
      .map((item) => {
        const base = item.equipment_name
        const serial = item.serial_number ? ` — ${item.serial_number}` : ''
        const quantity = item.quantity > 1 ? ` ×${item.quantity}` : ''
        return `${base}${serial}${quantity}`
      })
      .join('\n')
  }, [request])

  useEffect(() => {
    if (!open || !request) {
      return
    }

    setDueDate(request.return_due_date ?? '')
    setEquipment(fallbackEquipment)
  }, [open, request, fallbackEquipment])

  const handleClose = () => {
    if (isSubmitting) {
      return
    }

    setDueDate('')
    setEquipment('')
    onOpenChange(false)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!request) {
      return
    }

    const trimmedEquipment = equipment.trim()
    if (!dueDate) {
      toast.error('Укажите ориентировочную дату сдачи')
      return
    }

    if (trimmedEquipment.length === 0) {
      toast.error('Перечислите оборудование, которое нужно вернуть')
      return
    }

    setIsSubmitting(true)

    try {
      await scheduleReturn({
        id: request.id,
        data: {
          due_date: dueDate,
          equipment: trimmedEquipment,
        },
      })

      toast.success('Сдача оборудования запланирована')
      handleClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Произошла ошибка'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = request?.return_required
    ? 'Обновить план сдачи техники'
    : 'Запланировать сдачу техники'
  const description = request?.return_required
    ? 'Скорректируйте дату и список оборудования, если планы изменились.'
    : 'Укажите ориентировочную дату и перечислите технику, которую сотрудник должен вернуть.'

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="return-date">
                Дата сдачи <span className="text-red-500">*</span>
              </Label>
              <Input
                id="return-date"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="return-equipment">
                Оборудование к возврату <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="return-equipment"
                value={equipment}
                onChange={(event) => setEquipment(event.target.value)}
                placeholder="Введите перечень техники построчно"
                className="min-h-[140px]"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button type="submit" className="shadow-brand" disabled={isSubmitting}>
              {isSubmitting
                ? 'Сохраняем...'
                : request?.return_required
                  ? 'Сохранить изменения'
                  : 'Запланировать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
