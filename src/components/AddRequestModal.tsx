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
import { useRequestActions } from '../hooks/useRequests'
import { RequestFormFields } from './RequestFormFields'
import { useRequestFormState } from '../hooks/useRequestFormState'

interface AddRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddRequestModal({ open, onOpenChange }: AddRequestModalProps) {
  const [loading, setLoading] = useState(false)

  const firstInputRef = useRef<HTMLInputElement>(null)
  const { createRequest } = useRequestActions()
  const {
    employeeName,
    setEmployeeName,
    employeeNameError,
    setEmployeeNameError,
    login,
    setLogin,
    loginError,
    setLoginError,
    sdNumber,
    setSdNumber,
    notes,
    setNotes,
    equipmentItems,
    addEquipmentItem,
    removeEquipmentItem,
    updateEquipmentItem,
    hasIncompleteEquipmentItems,
    resetForm,
    payload,
  } = useRequestFormState({ persistKey: 'equipment-tracker:add-request-draft' })

  // Auto-focus first field when modal opens
  useEffect(() => {
    if (open) {
      // Focus first field after a small delay
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
      await createRequest(payload)
      toast.success('Заявка успешно создана')
      resetForm()
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Произошла ошибка'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

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

    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новая заявка на выдачу оборудования</DialogTitle>
          <DialogDescription>Укажите сотрудника и добавьте позиции оборудования</DialogDescription>
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
            sdNumber={sdNumber}
            onSdNumberChange={(value) => setSdNumber(value)}
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
              {loading ? 'Создание...' : 'Создать заявку'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
