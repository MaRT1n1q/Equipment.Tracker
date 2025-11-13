import { useEffect, useState } from 'react'
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
  Undo2,
  CalendarClock,
  AlertTriangle,
  Ban,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRequestActions } from '../hooks/useRequests'
import { cn } from '../lib/utils'

interface RequestsTableProps {
  requests: Request[]
  onEdit: (request: Request) => void
  onScheduleReturn: (request: Request) => void
  density?: 'comfortable' | 'dense'
  highlightRequestId?: number | null
  onHighlightConsumed?: () => void
}

export function RequestsTable({
  requests,
  onEdit,
  onScheduleReturn,
  density = 'comfortable',
  highlightRequestId,
  onHighlightConsumed,
}: RequestsTableProps) {
  const { toggleIssued, deleteRequest, restoreRequest, completeReturn, cancelReturn } =
    useRequestActions()
  const isDense = density === 'dense'
  const [expandedReturns, setExpandedReturns] = useState<Record<number, boolean>>({})
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
    info: {
      rail: 'bg-[hsl(var(--primary)/0.55)]',
      icon: 'bg-[hsl(var(--primary)/0.18)] text-[hsl(var(--primary))]',
      pill: 'status-pill status-pill--info',
      accent: 'text-[hsl(var(--primary))]',
    },
    danger: {
      rail: 'bg-[hsl(var(--destructive)/0.6)]',
      icon: 'bg-[hsl(var(--destructive)/0.18)] text-[hsl(var(--destructive))]',
      pill: 'status-pill status-pill--danger',
      accent: 'text-[hsl(var(--destructive))]',
    },
  } as const

  const returnStatusStyles = {
    success: {
      container:
        'border-[hsl(var(--success)/0.35)] bg-gradient-to-br from-[hsl(var(--success)/0.08)] via-transparent to-transparent dark:from-[hsl(var(--success)/0.12)]',
      icon: 'bg-[hsl(var(--success)/0.18)] text-[hsl(var(--success))]',
      hint: 'text-[hsl(var(--success))] dark:text-[hsl(var(--success))]',
    },
    info: {
      container:
        'border-[hsl(var(--primary)/0.35)] bg-gradient-to-br from-[hsl(var(--primary)/0.08)] via-transparent to-transparent dark:from-[hsl(var(--primary)/0.12)]',
      icon: 'bg-[hsl(var(--primary)/0.18)] text-[hsl(var(--primary))]',
      hint: 'text-[hsl(var(--primary))] dark:text-[hsl(var(--primary))]',
    },
    danger: {
      container:
        'border-[hsl(var(--destructive)/0.35)] bg-gradient-to-br from-[hsl(var(--destructive)/0.08)] via-transparent to-transparent dark:from-[hsl(var(--destructive)/0.12)]',
      icon: 'bg-[hsl(var(--destructive)/0.18)] text-[hsl(var(--destructive))]',
      hint: 'text-[hsl(var(--destructive))] dark:text-[hsl(var(--destructive))]',
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

  const handleCompleteReturn = async (id: number, nextValue: boolean) => {
    try {
      await completeReturn({ id, value: nextValue })
      toast.success(
        nextValue
          ? 'Сдача оборудования отмечена как выполненная'
          : 'Статус сдачи возвращён в ожидание'
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Произошла ошибка'
      toast.error(message)
    }
  }

  const handleCancelReturn = async (id: number) => {
    const confirmed = window.confirm('Отменить запланированную сдачу оборудования?')
    if (!confirmed) {
      return
    }

    try {
      await cancelReturn(id)
      setExpandedReturns((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      toast.success('Сдача оборудования отменена')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Произошла ошибка'
      toast.error(message)
    }
  }

  const handleToggleReturnCard = (id: number, current: boolean) => {
    setExpandedReturns((prev) => ({
      ...prev,
      [id]: !current,
    }))
  }

  useEffect(() => {
    if (!highlightRequestId) {
      return
    }

    const element = document.querySelector<HTMLElement>(`[data-request-id="${highlightRequestId}"]`)

    if (!element) {
      return
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setExpandedReturns((prev) => ({
      ...prev,
      [highlightRequestId]: true,
    }))

    const timeoutId = window.setTimeout(() => {
      onHighlightConsumed?.()
    }, 2000)

    return () => window.clearTimeout(timeoutId)
  }, [highlightRequestId, onHighlightConsumed])

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

  const formatReturnDate = (isoDate: string | null | undefined) => {
    if (!isoDate) {
      return '—'
    }

    const date = new Date(isoDate)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const fallbackEquipmentFromItems = (items: Request['equipment_items']) => {
    if (!items || items.length === 0) {
      return 'Оборудование не указано'
    }

    return items
      .map((item) => {
        const base = item.equipment_name
        const serial = item.serial_number ? ` — ${item.serial_number}` : ''
        const quantity = item.quantity > 1 ? ` ×${item.quantity}` : ''
        return `${base}${serial}${quantity}`
      })
      .join('\n')
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
          const hasReturn = request.return_required === 1
          const isReturnCompleted = request.return_completed === 1
          const returnDueDate = request.return_due_date ?? undefined
          const returnDateValue = returnDueDate ? new Date(returnDueDate) : null
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const isReturnOverdue =
            hasReturn && !isReturnCompleted && returnDateValue !== null && returnDateValue < today

          const statusKey = (() => {
            if (hasReturn && isReturnCompleted) {
              return 'success' as const
            }

            if (hasReturn && isReturnOverdue) {
              return 'danger' as const
            }

            if (hasReturn) {
              return 'info' as const
            }

            return isIssued ? ('success' as const) : ('warning' as const)
          })()

          const variant = statusVariants[statusKey]
          const equipmentItems = request.equipment_items ?? []
          const returnKey = hasReturn
            ? isReturnCompleted
              ? 'success'
              : isReturnOverdue
                ? 'danger'
                : 'info'
            : null
          const returnStyles = returnKey ? returnStatusStyles[returnKey] : null
          const isHighlighted = highlightRequestId === request.id
          const isReturnExpanded = expandedReturns[request.id] ?? (isReturnOverdue ? true : false)
          const summaryTone = (() => {
            if (isReturnOverdue) {
              return 'text-[hsl(var(--destructive))]'
            }

            if (isReturnCompleted) {
              return returnStyles?.hint ?? 'text-[hsl(var(--primary))]'
            }

            return 'text-muted-foreground'
          })()
          const StatusIcon = (() => {
            if (hasReturn && isReturnCompleted) {
              return CheckCircle2
            }

            if (hasReturn && isReturnOverdue) {
              return AlertTriangle
            }

            if (hasReturn) {
              return Undo2
            }

            return isIssued ? CheckCircle2 : Clock
          })()
          const ReturnIcon = (() => {
            if (!hasReturn) {
              return CalendarClock
            }

            if (isReturnCompleted) {
              return CheckCircle2
            }

            if (isReturnOverdue) {
              return AlertTriangle
            }

            return CalendarClock
          })()
          const summaryLine = isReturnCompleted
            ? request.return_completed_at
              ? `Оборудование принято ${formatDate(request.return_completed_at)}`
              : 'Сдача отмечена как завершённая'
            : `Плановая дата: ${formatReturnDate(returnDueDate)}`

          const statusLabel = (() => {
            if (hasReturn && isReturnCompleted) {
              return 'Сдача завершена'
            }

            if (hasReturn && isReturnOverdue) {
              return 'Сдача просрочена'
            }

            if (hasReturn) {
              return 'Ожидает сдачи'
            }

            return isIssued ? 'Выдано' : 'В ожидании'
          })()

          const statusTitle = (() => {
            if (hasReturn && isReturnCompleted) {
              return 'Сдача выполнена'
            }

            if (hasReturn && isReturnOverdue) {
              return 'Сдача просрочена'
            }

            if (hasReturn) {
              return 'Сдача запланирована'
            }

            return isIssued ? 'Выдано' : 'Ожидает выдачи'
          })()

          const statusHint = (() => {
            if (hasReturn && isReturnCompleted) {
              return 'Снимите отметку, если оборудование ещё не вернули'
            }

            if (hasReturn && isReturnOverdue) {
              return 'Назначьте новую дату или отметьте сдачу, чтобы снять просрочку'
            }

            if (hasReturn) {
              return 'Отметьте сдачу, когда техника вернётся на склад'
            }

            return isIssued
              ? 'Снимите, если техника не передана'
              : 'Отметьте при передаче сотруднику'
          })()

          return (
            <div
              key={request.id}
              data-request-id={request.id}
              className={cn(
                'group relative overflow-hidden surface-card animate-fade-in',
                'transition-all duration-200 hover:-translate-y-1 hover:border-[hsl(var(--primary)/0.3)] hover:shadow-medium',
                isHighlighted &&
                  'ring-2 ring-[hsl(var(--primary))] ring-offset-2 ring-offset-background'
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
                        {statusLabel}
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
                      checked={hasReturn ? isReturnCompleted : isIssued}
                      onCheckedChange={(nextValue) => {
                        if (hasReturn) {
                          const nextCompleted = Boolean(nextValue)
                          handleCompleteReturn(request.id, nextCompleted)
                          return
                        }

                        handleToggleIssued(request.id, isIssued)
                      }}
                      aria-label={
                        hasReturn
                          ? isReturnCompleted
                            ? 'Снять отметку о сдаче оборудования'
                            : 'Отметить сдачу оборудования'
                          : isIssued
                            ? 'Отменить отметку о выдаче'
                            : 'Отметить, что оборудование выдано'
                      }
                      className={cn(
                        'h-4 w-4 text-primary-foreground data-[state=checked]:bg-[hsl(var(--primary))]',
                        hasReturn &&
                          'border-[hsl(var(--primary)/0.35)] data-[state=checked]:bg-[hsl(var(--primary))]'
                      )}
                    />
                    <div className="flex flex-col leading-tight">
                      <span className="font-semibold text-foreground">{statusTitle}</span>
                      <span className="text-[0.7rem] opacity-80">{statusHint}</span>
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
                    {!hasReturn && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onScheduleReturn(request)}
                      >
                        <Undo2 className="h-4 w-4" />
                        Запланировать сдачу
                      </Button>
                    )}
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

                {hasReturn && (
                  <div
                    className={cn(
                      'mt-3 w-full rounded-2xl border p-4 transition-colors',
                      'shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
                      returnStyles?.container ?? 'border-border/60 bg-muted/20'
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        aria-expanded={isReturnExpanded}
                        onClick={() => handleToggleReturnCard(request.id, isReturnExpanded)}
                        className="flex flex-1 min-w-0 items-start gap-3 text-left"
                      >
                        <span
                          className={cn(
                            'inline-flex h-9 w-9 items-center justify-center rounded-lg',
                            returnStyles?.icon ??
                              'bg-[hsl(var(--primary)/0.18)] text-[hsl(var(--primary))]'
                          )}
                        >
                          <ReturnIcon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-semibold text-foreground">
                            Сдача оборудования
                          </p>
                          <p className={cn('text-xs', summaryTone)}>{summaryLine}</p>
                          {!isReturnExpanded && isReturnOverdue && (
                            <p className="text-xs font-medium text-[hsl(var(--destructive))]">
                              Просрочено. Назначьте новую дату или отметьте сдачу.
                            </p>
                          )}
                        </div>
                      </button>
                      <div
                        className="flex cursor-pointer items-center gap-2"
                        role="presentation"
                        onClick={() => handleToggleReturnCard(request.id, isReturnExpanded)}
                      >
                        <span
                          className={cn(
                            'status-pill',
                            isReturnCompleted
                              ? 'status-pill--success'
                              : isReturnOverdue
                                ? 'status-pill--danger'
                                : 'status-pill--info'
                          )}
                        >
                          {statusLabel}
                        </span>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 text-muted-foreground transition-transform',
                            isReturnExpanded && 'rotate-180'
                          )}
                        />
                      </div>
                    </div>
                    {isReturnExpanded && (
                      <div className="mt-4 space-y-3">
                        <div className="rounded-lg border border-dashed border-border/60 bg-background/40 p-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                          {request.return_equipment || fallbackEquipmentFromItems(equipmentItems)}
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onScheduleReturn(request)}
                            className="border-[hsl(var(--primary)/0.4)]"
                          >
                            <Undo2 className="h-4 w-4" />
                            Изменить сдачу
                          </Button>
                          {!isReturnCompleted && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleCompleteReturn(request.id, true)}
                              className="border-[hsl(var(--success)/0.4)] text-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.12)]"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Завершить сдачу
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelReturn(request.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Ban className="h-4 w-4" />
                            Отменить
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
