import { useState } from 'react'
import type { Request } from '../types/ipc'
import { Checkbox } from './ui/checkbox'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  Trash2,
  Package,
  FileText,
  Edit2,
  MessageSquare,
  Calendar,
  Hash,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRequestActions } from '../hooks/useRequests'
import { cn } from '../lib/utils'

interface RequestsTableProps {
  requests: Request[]
  onEdit: (request: Request) => void
  density?: 'comfortable' | 'dense'
}

export function RequestsTable({ requests, onEdit, density = 'comfortable' }: RequestsTableProps) {
  const { toggleIssued, deleteRequest, restoreRequest } = useRequestActions()
  const isDense = density === 'dense'
  const [commentModal, setCommentModal] = useState<{
    employeeName: string
    login?: string | null
    comment: string
  } | null>(null)

  const statusVariants = {
    success: {
      rail: 'bg-[hsl(var(--success)/0.6)]',
      icon: 'bg-[hsl(var(--success)/0.18)] text-[hsl(var(--success))]',
      pill: 'status-pill status-pill--success',
      accent: 'text-[hsl(var(--success))]',
    },
    warning: {
      rail: 'bg-[hsl(var(--warning)/0.6)]',
      icon: 'bg-[hsl(var(--warning)/0.18)] text-[hsl(var(--warning))]',
      pill: 'status-pill status-pill--warning',
      accent: 'text-[hsl(var(--warning))]',
    },
  } as const

  const handleToggleIssued = async (id: number, currentStatus: boolean) => {
    try {
      await toggleIssued({ id, value: !currentStatus })
      toast.success(!currentStatus ? 'Оборудование отмечено как выданное' : 'Статус отменен')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Произошла ошибка'
      toast.error(message)
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      'Удалить заявку? Данные можно будет восстановить только в течение текущей сессии.'
    )
    if (!confirmed) {
      return
    }

    try {
      const deletedRequest = await deleteRequest(id)

      toast.success('Заявка удалена', {
        action: {
          label: 'Отменить',
          onClick: async () => {
            try {
              await restoreRequest(deletedRequest)
              toast.success('Заявка восстановлена')
            } catch (restoreError) {
              const message =
                restoreError instanceof Error ? restoreError.message : 'Ошибка при восстановлении'
              toast.error(message)
            }
          },
        },
        duration: 5000,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Произошла ошибка'
      toast.error(message)
    }
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-16 px-4 animate-fade-in">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 mb-6">
          <Package className="h-12 w-12 text-purple-500" />
        </div>
        <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
          Заявок пока нет
        </h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Создайте первую заявку на выдачу оборудования, нажав кнопку "Добавить заявку" или
          используя <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">Ctrl+N</kbd>
        </p>
        <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            <span>Учёт заявок</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-green-500" />
            </div>
            <span>Контроль выдачи</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={cn('space-y-4', { 'space-y-3': isDense })}>
        {requests.map((request, index) => {
          const isIssued = Boolean(request.is_issued)
          const variant = statusVariants[isIssued ? 'success' : 'warning']
          const equipmentItems = request.equipment_items ?? []
          const StatusIcon = isIssued ? CheckCircle2 : Clock

          return (
            <div
              key={request.id}
              className={cn(
                'group relative overflow-hidden surface-card animate-fade-in',
                'transition-all duration-200 hover:-translate-y-1 hover:border-[hsl(var(--primary)/0.3)] hover:shadow-medium'
              )}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${variant.rail}`} />

              <div
                className={cn('relative flex flex-col gap-4 p-4 sm:p-5', {
                  'gap-3 p-3 sm:p-4': isDense,
                })}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex h-8 w-8 items-center justify-center rounded-lg',
                          variant.icon,
                          { 'h-7 w-7': isDense }
                        )}
                      >
                        <StatusIcon className={cn('h-4 w-4', isDense && 'h-3.5 w-3.5')} />
                      </span>
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            'font-semibold leading-tight text-base',
                            isDense && 'text-sm'
                          )}
                        >
                          {request.employee_name}
                        </span>
                        <span className="text-sm text-muted-foreground/80">{request.login}</span>
                        {request.sd_number && (
                          <span className="text-xs uppercase tracking-wide text-muted-foreground/70">
                            SD {request.sd_number}
                          </span>
                        )}
                      </div>
                      <span className={cn(variant.pill, 'ml-auto', isDense && 'px-2.5 py-0.5')}>
                        {isIssued ? 'Выдано' : 'В ожидании'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <span>Создана {formatDate(request.created_at)}</span>
                      </div>
                      {request.issued_at && (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className={cn('h-4 w-4', variant.accent)} />
                          <span>Выдано {formatDate(request.issued_at)}</span>
                        </div>
                      )}
                      {request.notes && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="flex items-center gap-1.5 text-blue-600 underline-offset-2 transition-colors hover:underline dark:text-blue-400"
                              onClick={() =>
                                setCommentModal({
                                  employeeName: request.employee_name,
                                  login: request.login,
                                  comment: request.notes ?? '',
                                })
                              }
                            >
                              <MessageSquare className="h-4 w-4" />
                              <span>Комментарий</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs whitespace-pre-wrap">{request.notes}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  <label
                    className={cn(
                      'flex w-full max-w-xs items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground transition-colors sm:text-sm',
                      'hover:border-[hsl(var(--primary)/0.35)] hover:text-foreground',
                      { 'px-2 py-1.5': isDense }
                    )}
                  >
                    <Checkbox
                      checked={isIssued}
                      onCheckedChange={() => handleToggleIssued(request.id, isIssued)}
                      aria-label={
                        isIssued ? 'Отменить отметку о выдаче' : 'Отметить, что оборудование выдано'
                      }
                      className="h-4 w-4 border-[hsl(var(--primary)/0.35)] text-primary-foreground data-[state=checked]:bg-[hsl(var(--primary))]"
                    />
                    <div className="flex flex-col leading-tight">
                      <span className="font-semibold text-foreground">
                        {isIssued ? 'Выдано' : 'Ожидает выдачи'}
                      </span>
                      <span className="text-[0.7rem] opacity-80">
                        {isIssued
                          ? 'Снимите, если техника не передана'
                          : 'Отметьте при передаче сотруднику'}
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className={cn('space-y-2', { 'space-y-1.5': isDense }, 'min-w-0 flex-1')}>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Package className="h-4 w-4 text-[hsl(var(--primary))]" />
                      <span>Оборудование</span>
                    </div>
                    {equipmentItems.length > 0 ? (
                      <ul
                        className={cn('ml-6 list-disc space-y-1.5 text-sm marker:text-orange-500', {
                          'space-y-1': isDense,
                        })}
                      >
                        {equipmentItems.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-foreground">
                              {item.equipment_name}
                            </span>
                            {item.quantity > 1 && (
                              <span className="status-pill status-pill--info">
                                ×{item.quantity}
                              </span>
                            )}
                            {item.serial_number && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Hash className="h-3 w-3" />
                                <span className="font-mono">{item.serial_number}</span>
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="ml-6 text-sm text-muted-foreground">Нет оборудования</p>
                    )}
                  </div>

                  <div className="flex w-full justify-end gap-2 sm:w-auto sm:justify-start">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(request)}
                    >
                      <Edit2 className="h-4 w-4" />
                      Редактировать
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(request.id)}
                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Удалить
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog
        open={Boolean(commentModal)}
        onOpenChange={(open) => {
          if (!open) {
            setCommentModal(null)
          }
        }}
      >
        {commentModal && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Комментарий</DialogTitle>
              <DialogDescription>
                {commentModal.employeeName}
                {commentModal.login ? ` · ${commentModal.login}` : ''}
              </DialogDescription>
            </DialogHeader>
            <p className="whitespace-pre-wrap text-sm text-foreground/90">{commentModal.comment}</p>
            <DialogFooter>
              <Button type="button" onClick={() => setCommentModal(null)}>
                Закрыть
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </TooltipProvider>
  )
}
