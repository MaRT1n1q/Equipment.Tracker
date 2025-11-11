import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { toast } from 'sonner'
import type { Request } from '../types/ipc'
import { useRequestActions } from '../hooks/useRequests'
import { RequestFormFields } from './RequestFormFields'
import { useRequestFormState } from '../hooks/useRequestFormState'

interface EditRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: Request | null
}

export function EditRequestModal({ open, onOpenChange, request }: EditRequestModalProps) {
  const [loading, setLoading] = useState(false)

  const firstInputRef = useRef<HTMLInputElement>(null)
  const { updateRequest } = useRequestActions()
  const {
    employeeName,
    setEmployeeName,
    employeeNameError,
    setEmployeeNameError,
    login,
    setLogin,
    loginError,
    setLoginError,
    notes,
    setNotes,
    equipmentItems,
    addEquipmentItem,
    removeEquipmentItem,
    updateEquipmentItem,
    hasIncompleteEquipmentItems,
    resetForm,
    payload,
  } = useRequestFormState()

  // Load request data when modal opens
  useEffect(() => {
    if (open && request) {
      resetForm({
        employeeName: request.employee_name,
        login: request.login,
        notes: request.notes || '',
        equipmentItems:
          request.equipment_items && request.equipment_items.length > 0
            ? request.equipment_items
            : undefined,
      })

      // Focus first field after a small delay
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
    }
  }, [open, request, resetForm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!request) return

    // Validate employee name
    if (!employeeName.trim()) {
      setEmployeeNameError(true)
      toast.error('Укажите ФИО сотрудника')
      return
    }

    if (!login.trim()) {
      setLoginError(true)
      toast.error('Укажите логин сотрудника')
      return
    }

    if (hasIncompleteEquipmentItems) {
      toast.error('Заполните все поля оборудования')
      return
    }

    setLoading(true)
    try {
      await updateRequest({
        id: request.id,
        data: payload,
      })

      toast.success('Заявка успешно обновлена')
      resetForm({
        employeeName: payload.employee_name,
        login: payload.login,
        notes: payload.notes ?? '',
        equipmentItems: payload.equipment_items,
      })
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Произошла ошибка'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (!request) return null

  const handleClose = () => {
    if (loading) {
      return
    }

    resetForm()
    onOpenChange(false)
  }

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen && loading) {
      return
    }

    if (!nextOpen) {
      resetForm()
    }

    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактирование заявки #{request.id}</DialogTitle>
          <DialogDescription>Внесите изменения в информацию о заявке</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <RequestFormFields
            ref={firstInputRef}
            employeeName={employeeName}
            onEmployeeNameChange={(value) => {
              setEmployeeName(value)
              if (employeeNameError) {
                setEmployeeNameError(false)
              }
            }}
            employeeNameError={employeeNameError}
            login={login}
            onLoginChange={(value) => {
              setLogin(value)
              if (loginError) {
                setLoginError(false)
              }
            }}
            loginError={loginError}
            notes={notes}
            onNotesChange={(value) => setNotes(value)}
            equipmentItems={equipmentItems}
            onAddItem={addEquipmentItem}
            onRemoveItem={removeEquipmentItem}
            onUpdateItem={updateEquipmentItem}
            disabled={loading}
          />

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading} className="shadow-brand">
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
