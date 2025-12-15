import { useEffect } from 'react'
import type { EmployeeExit } from '../types/ipc'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import {
  Trash2,
  UserMinus,
  Calendar,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Edit2,
  Hash,
} from 'lucide-react'
import { toast } from 'sonner'
import { useEmployeeExitActions } from '../hooks/useEmployeeExits'
import { cn } from '../lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import {
  parseExitEquipmentList,
  stringifyExitEquipmentItems,
  type ExitEquipmentItem,
} from '../lib/employeeExitEquipment'

interface EmployeeExitTableProps {
  exits: EmployeeExit[]
  isFiltered?: boolean
  density?: 'comfortable' | 'dense'
  onEdit: (exit: EmployeeExit) => void
  highlightExitId?: number | null
  onHighlightConsumed?: () => void
}

export function EmployeeExitTable({
  exits,
  isFiltered = false,
  density = 'comfortable',
  onEdit,
  highlightExitId,
  onHighlightConsumed,
}: EmployeeExitTableProps) {
  const { updateExitCompleted, deleteEmployeeExit } = useEmployeeExitActions()
  const isDense = density === 'dense'
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
    danger: {
      rail: 'bg-[hsl(var(--destructive)/0.6)]',
      icon: 'bg-[hsl(var(--destructive)/0.18)] text-[hsl(var(--destructive))]',
      pill: 'status-pill status-pill--danger',
      accent: 'text-[hsl(var(--destructive))]',
    },
  } as const

  const handleToggleCompleted = async (id: number, currentStatus: boolean) => {
    try {
      await updateExitCompleted({ id, value: !currentStatus })
      toast.success(
        !currentStatus ? 'Выдача оборудования отмечена как завершённая' : 'Статус отменен'
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Произошла ошибка'
      toast.error(message)
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      'Удалить запись о выходе сотрудника? Действие необратимо без резервной копии.'
    )
    if (!confirmed) {
      return
    }

    try {
      await deleteEmployeeExit(id)
      toast.success('Запись удалена')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Произошла ошибка'
      toast.error(message)
    }
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const copyEquipment = async (items: ExitEquipmentItem[], employeeName: string) => {
    if (items.length === 0) {
      toast.info('Список оборудования пуст')
      return
    }

    const text = stringifyExitEquipmentItems(items)

    try {
      await navigator.clipboard.writeText(text)
      toast.success(`Список оборудования для ${employeeName} скопирован`)
    } catch (error) {
      toast.error('Не удалось скопировать данные')
      console.error(error)
    }
  }

  useEffect(() => {
    if (!highlightExitId) {
      return
    }

    const element = document.querySelector<HTMLElement>(`[data-exit-id="${highlightExitId}"]`)

    if (!element) {
      return
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const timeoutId = window.setTimeout(() => {
      onHighlightConsumed?.()
    }, 2000)

    return () => window.clearTimeout(timeoutId)
  }, [highlightExitId, onHighlightConsumed])

  if (exits.length === 0) {
    if (isFiltered) {
      return (
        <div className="text-center py-14 px-4 animate-fade-in">
          <div className="mx-auto mb-5 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))]">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Совпадений не найдено</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Попробуйте изменить параметры поиска или фильтрации.
          </p>
        </div>
      )
    }

    return (
      <div className="text-center py-14 px-4 animate-fade-in">
        <div className="mx-auto mb-5 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]">
          <UserMinus className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">Записей пока нет</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Создайте первую запись о выдаче оборудования сотруднику — нажмите «Добавить запись»
          вверху.
        </p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={cn('space-y-4', { 'space-y-3': isDense })}>
        {exits.map((exit, index) => {
          const isCompleted = exit.is_completed === 1
          const equipmentItems = parseExitEquipmentList(exit.equipment_list)
          const exitDate = new Date(exit.exit_date)
          exitDate.setHours(0, 0, 0, 0)
          const isOverdue = !isCompleted && exitDate < today
          const variantKey = isCompleted ? 'success' : isOverdue ? 'danger' : 'warning'
          const variant = statusVariants[variantKey]
          const StatusIcon = isCompleted ? CheckCircle2 : isOverdue ? AlertTriangle : Clock
          const statusLabel = isCompleted ? 'Завершено' : isOverdue ? 'Просрочено' : 'Ожидает'
          const statusTitle = isCompleted
            ? 'Выдача завершена'
            : isOverdue
              ? 'Выдача просрочена'
              : 'Выдача запланирована'
          const statusHint = isCompleted
            ? 'Если оборудование ещё в работе, снимите отметку.'
            : isOverdue
              ? 'Отметьте выдачу или скорректируйте дату, чтобы убрать просрочку.'
              : 'Отметьте завершение, когда оборудование будет передано.'
          const isHighlighted = highlightExitId === exit.id

          return (
            <div
              key={exit.id}
              data-exit-id={exit.id}
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
                          {exit.employee_name}
                        </span>
                        <span
                          className={cn(
                            'rounded-md bg-muted/30 px-2 py-0.5 text-xs font-mono text-muted-foreground',
                            !isDense && 'sm:text-sm'
                          )}
                          title={exit.login}
                        >
                          {exit.login}
                        </span>
                        {exit.sd_number && (
                          <span className="inline-flex items-center rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            SD {exit.sd_number}
                          </span>
                        )}
                      </div>
                      <span className={cn(variant.pill, 'ml-auto', isDense && 'px-2.5 py-0.5')}>
                        {statusLabel}
                      </span>
                    </div>

                    <div
                      className={cn(
                        'flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground',
                        !isDense && 'sm:text-sm'
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Дата выхода {formatDate(exit.exit_date)}</span>
                      </div>
                    </div>

                    {isOverdue && (
                      <div
                        className={cn(
                          'flex items-center gap-1.5 text-sm font-medium',
                          variant.accent
                        )}
                      >
                        <AlertTriangle className="h-4 w-4" />
                        <span>Выдача оборудования просрочена</span>
                      </div>
                    )}
                  </div>

                  <label
                    className={cn(
                      'flex w-full max-w-xs items-center gap-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground transition-colors',
                      !isDense && 'sm:text-sm',
                      'hover:border-[hsl(var(--primary)/0.35)] hover:text-foreground',
                      { 'px-2 py-1.5': isDense }
                    )}
                  >
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => handleToggleCompleted(exit.id, isCompleted)}
                      aria-label={
                        isCompleted
                          ? 'Отменить отметку о завершении выдачи'
                          : 'Отметить выдачу как завершенную'
                      }
                      className="h-4 w-4 border-[hsl(var(--success)/0.35)] text-primary-foreground data-[state=checked]:bg-[hsl(var(--success))]"
                    />
                    <div className="flex flex-col leading-tight">
                      <span className="font-semibold text-foreground">{statusTitle}</span>
                      <span
                        className={cn(
                          'text-[0.72rem] leading-snug text-muted-foreground',
                          isDense && 'text-[0.68rem]'
                        )}
                      >
                        {statusHint}
                      </span>
                    </div>
                  </label>
                </div>

                <div
                  className={cn(
                    'flex flex-wrap items-start justify-between gap-3 border-t border-border/50 pt-3',
                    isDense && 'pt-2'
                  )}
                >
                  <div className={cn('space-y-2', { 'space-y-1.5': isDense }, 'min-w-0 flex-1')}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Package className="h-4 w-4 text-[hsl(var(--primary))]" />
                        <span>Оборудование</span>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => copyEquipment(equipmentItems, exit.employee_name)}
                            className={cn(
                              'h-8 w-8 rounded-md border border-transparent text-[hsl(var(--primary))] transition-all hover:border-[hsl(var(--primary)/0.25)] hover:bg-[hsl(var(--primary)/0.08)] hover:text-[hsl(var(--primary))]',
                              'dark:hover:bg-[hsl(var(--primary)/0.12)]'
                            )}
                            aria-label={`Скопировать список оборудования для ${exit.employee_name}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Скопировать список оборудования</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {equipmentItems.length > 0 ? (
                      <ul
                        className={cn(
                          'ml-6 list-disc space-y-1.5 text-sm marker:text-[hsl(var(--primary))]',
                          {
                            'space-y-1': isDense,
                          }
                        )}
                      >
                        {equipmentItems.map((item, idx) => (
                          <li key={idx} className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-foreground">{item.name || '—'}</span>
                            {item.serial && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Hash className="h-3 w-3" />
                                <span className="font-mono" title={item.serial}>
                                  {item.serial}
                                </span>
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
                    <Button type="button" variant="outline" size="sm" onClick={() => onEdit(exit)}>
                      <Edit2 className="h-4 w-4" />
                      Редактировать
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(exit.id)}
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
    </TooltipProvider>
  )
}
