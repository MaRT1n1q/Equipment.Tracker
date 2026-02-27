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
import { ClipboardList, Pencil } from 'lucide-react'
import type { Request } from '../types/ipc'
import { useRequestActions } from '../hooks/useRequests'
import { RequestFormFields } from './RequestFormFields'
import { useRequestFormState } from '../hooks/useRequestFormState'
import { AuditHistoryPanel } from './AuditHistoryPanel'
import { cn } from '../lib/utils'

interface EditRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: Request | null
}

type Tab = 'form' | 'history'

export function EditRequestModal({ open, onOpenChange, request }: EditRequestModalProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('form')
  const persistKey = request ? `equipment-tracker:edit-request-${request.id}` : undefined

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
    sdNumber,
    setSdNumber,
    deliveryUrl,
    setDeliveryUrl,
    notes,
    setNotes,
    equipmentItems,
    addEquipmentItem,
    removeEquipmentItem,
    updateEquipmentItem,
    hasIncompleteEquipmentItems,
    resetForm,
    payload,
  } = useRequestFormState({ persistKey })
  const previousRequestIdRef = useRef<number | null>(null)

  // Reset tab when switching requests
  useEffect(() => {
    if (open) setActiveTab('form')
  }, [open, request?.id])

  // Load request data when modal opens and when switching between requests
  useEffect(() => {
    if (!open || !request) {
      return
    }

    if (previousRequestIdRef.current !== request.id) {
      resetForm({
        employeeName: request.employee_name,
        login: request.login,
        sdNumber: request.sd_number ?? '',
        deliveryUrl: request.delivery_url ?? '',
        notes: request.notes || '',
        equipmentItems:
          request.equipment_items && request.equipment_items.length > 0
            ? request.equipment_items
            : undefined,
      })
      previousRequestIdRef.current = request.id
    }

    setTimeout(() => {
      firstInputRef.current?.focus()
    }, 100)
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
        sdNumber: payload.sd_number ?? '',
        deliveryUrl: payload.delivery_url ?? '',
        notes: payload.notes ?? '',
        equipmentItems: payload.equipment_items,
      })
      previousRequestIdRef.current = request.id
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Произошла ошибка'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (!request) return null

  const restoreInitialState = () => {
    resetForm({
      employeeName: request.employee_name,
      login: request.login,
      sdNumber: request.sd_number ?? '',
      deliveryUrl: request.delivery_url ?? '',
      notes: request.notes || '',
      equipmentItems:
        request.equipment_items && request.equipment_items.length > 0
          ? request.equipment_items
          : undefined,
    })
  }

  const handleClose = () => {
    if (loading) {
      return
    }

    restoreInitialState()
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Редактирование заявки #{request.id}</DialogTitle>
          <DialogDescription>Внесите изменения в информацию о заявке</DialogDescription>
        </DialogHeader>

        {/* Таб-переключатель */}
        <div className="flex gap-1 p-1 bg-muted/40 rounded-lg border border-border/50">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
              activeTab === 'form'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Pencil className="h-3.5 w-3.5" />
            Основное
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
              activeTab === 'history'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            История
          </button>
        </div>

        {/* Контент таба */}
        <div className="mt-4">
          {activeTab === 'form' ? (
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
                deliveryUrl={deliveryUrl}
                onDeliveryUrlChange={(value) => setDeliveryUrl(value)}
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
          ) : (
            <div className="py-4 px-1">
              <AuditHistoryPanel entityType="request" entityId={request.id} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
