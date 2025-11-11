import type { EmployeeExit } from '../types/ipc'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import {
  Trash2,
  UserMinus,
  Calendar,
  User,
  KeyRound,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Edit2,
  Tag,
} from 'lucide-react'
import { toast } from 'sonner'
import { useEmployeeExitActions } from '../hooks/useEmployeeExits'
import { cn } from '../lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

interface EmployeeExitTableProps {
  exits: EmployeeExit[]
  isFiltered?: boolean
  density?: 'comfortable' | 'dense'
  onEdit: (exit: EmployeeExit) => void
}

export function EmployeeExitTable({
  exits,
  isFiltered = false,
  density = 'comfortable',
  onEdit,
}: EmployeeExitTableProps) {
  const { updateExitCompleted, deleteEmployeeExit } = useEmployeeExitActions()
  const isDense = density === 'dense'
  const statusVariants = {
    success: {
      rail: 'bg-[linear-gradient(180deg,hsl(var(--success))0%,hsl(var(--success)/0.6)100%)]',
      icon: 'status-icon status-icon--success',
      pill: 'status-pill status-pill--success',
    },
    warning: {
      rail: 'bg-[linear-gradient(180deg,hsl(var(--warning))0%,hsl(var(--warning)/0.6)100%)]',
      icon: 'status-icon status-icon--warning',
      pill: 'status-pill status-pill--warning',
    },
    danger: {
      rail: 'bg-[linear-gradient(180deg,hsl(var(--destructive))0%,hsl(var(--destructive)/0.6)100%)]',
      icon: 'status-icon status-icon--danger',
      pill: 'status-pill status-pill--danger',
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

  const copyEquipment = async (items: string[], employeeName: string) => {
    if (items.length === 0) {
      toast.info('Список оборудования пуст')
      return
    }

    const text = items.join('\n')

    try {
      await navigator.clipboard.writeText(text)
      toast.success(`Список оборудования для ${employeeName} скопирован`)
    } catch (error) {
      toast.error('Не удалось скопировать данные')
      console.error(error)
    }
  }

  if (exits.length === 0) {
    if (isFiltered) {
      return (
        <div className="text-center py-16 px-4 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 mb-6">
            <AlertTriangle className="h-12 w-12 text-orange-500" />
          </div>
          <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
            Совпадений не найдено
          </h3>
          <p className="text-muted-foreground mb-2 max-w-md mx-auto">
            Попробуйте изменить параметры поиска или фильтрации.
          </p>
        </div>
      )
    }

    return (
      <div className="text-center py-16 px-4 animate-fade-in">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 mb-6">
          <UserMinus className="h-12 w-12 text-orange-500" />
        </div>
        <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
          Записей пока нет
        </h3>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Создайте первую запись о выходе сотрудника и необходимом оборудовании
        </p>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className={cn('space-y-4', { 'space-y-3': isDense })}>
        {exits.map((exit, index) => {
          const isCompleted = exit.is_completed === 1
          const equipmentItems = exit.equipment_list.split('\n').filter((item) => item.trim())
          const exitDate = new Date(exit.exit_date)
          exitDate.setHours(0, 0, 0, 0)
          const isOverdue = !isCompleted && exitDate < today
          const variantKey = isCompleted ? 'success' : isOverdue ? 'danger' : 'warning'
          const variant = statusVariants[variantKey]
          const StatusIcon = isCompleted ? CheckCircle2 : isOverdue ? AlertTriangle : Clock

          return (
            <div
              key={exit.id}
              className="group relative surface-card surface-card-hover overflow-hidden animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Status gradient bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${variant.rail}`} />

              <div className={cn('p-4 pl-5', { 'p-3 pl-4': isDense })}>
                <div className={cn('flex items-start justify-between gap-4', { 'gap-3': isDense })}>
                  {/* Main Info */}
                  <div className={cn('flex-1 space-y-3', { 'space-y-2.5': isDense })}>
                    {/* Employee Name & Status */}
                    <div className={cn('flex items-center gap-3 flex-wrap', { 'gap-2': isDense })}>
                      <div className={cn('flex items-center gap-2', { 'gap-1.5': isDense })}>
                        <div className={cn(variant.icon, isDense ? 'scale-90' : '')}>
                          <StatusIcon
                            className={cn('text-current', isDense ? 'w-4 h-4' : 'w-5 h-5')}
                          />
                        </div>
                        <div>
                          <div className={cn('flex items-center gap-2', { 'gap-1.5': isDense })}>
                            <User
                              className={cn(
                                'text-muted-foreground',
                                isDense ? 'w-3.5 h-3.5' : 'w-4 h-4'
                              )}
                            />
                            <span
                              className={cn('font-semibold', isDense ? 'text-base' : 'text-lg')}
                            >
                              {exit.employee_name}
                            </span>
                          </div>
                          <div
                            className={cn(
                              'flex flex-wrap items-center gap-3 text-xs text-muted-foreground',
                              isDense ? 'gap-2' : ''
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <KeyRound
                                className={cn(
                                  'text-muted-foreground',
                                  isDense ? 'w-3 h-3' : 'w-3.5 h-3.5'
                                )}
                              />
                              <span>{exit.login}</span>
                            </div>
                            {exit.sd_number && (
                              <>
                                <span className="text-muted-foreground/60">•</span>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Tag
                                    className={cn(
                                      'text-muted-foreground',
                                      isDense ? 'w-3 h-3' : 'w-3.5 h-3.5'
                                    )}
                                  />
                                  <span className="uppercase text-[0.65rem] tracking-wide text-muted-foreground/70">
                                    номер SD
                                  </span>
                                  <span className="font-medium text-foreground normal-case">
                                    {exit.sd_number}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={cn(variant.pill, isDense && 'px-2.5 py-0.5')}>
                        {isCompleted ? 'Завершено' : isOverdue ? 'Просрочено' : 'Ожидает'}
                      </span>
                    </div>

                    {/* Exit Date */}
                    <div className={cn('flex items-center gap-2 text-sm', { 'text-xs': isDense })}>
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span className="text-muted-foreground">Дата выхода:</span>
                      <span className="font-medium">{formatDate(exit.exit_date)}</span>
                    </div>

                    {isOverdue && (
                      <div className="flex items-center gap-2 text-sm text-[hsl(var(--destructive))] dark:text-[hsl(var(--destructive))]">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Выдача оборудования просрочена</span>
                      </div>
                    )}

                    {/* Equipment List */}
                    <div className={cn('space-y-2', { 'space-y-1.5': isDense })}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Package className="w-4 h-4 text-[hsl(var(--primary))]" />
                          <span>Оборудование для выдачи:</span>
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
                      <div className={cn('pl-6 space-y-1', { 'pl-5 space-y-0.5': isDense })}>
                        {equipmentItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <span className="text-orange-500 mt-1">•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className={cn(
                      'flex shrink-0 flex-col items-stretch gap-2.5 min-w-full sm:min-w-[13.5rem]',
                      {
                        'gap-2 sm:min-w-[12rem]': isDense,
                      }
                    )}
                  >
                    <div
                      className={cn(
                        'w-full rounded-lg border border-border/70 bg-muted/40 px-3 py-2.5 text-left shadow-[0_10px_22px_-18px_rgba(15,23,42,0.35)] transition-all duration-200 hover:border-[hsl(var(--primary)/0.3)] hover:shadow-[0_16px_28px_-18px_rgba(79,70,229,0.42)] dark:bg-muted/60',
                        { 'px-2.5 py-2': isDense }
                      )}
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="space-y-1">
                          <p className="text-[0.6rem] uppercase tracking-wide text-muted-foreground/70">
                            Статус выдачи
                          </p>
                          <p className="text-xs font-semibold text-foreground">
                            {isCompleted
                              ? 'Выдача завершена'
                              : isOverdue
                                ? 'Выдача просрочена'
                                : 'Выдача запланирована'}
                          </p>
                        </div>
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => handleToggleCompleted(exit.id, isCompleted)}
                          aria-label={
                            isCompleted
                              ? 'Отменить отметку о завершении выдачи'
                              : 'Отметить выдачу как завершенную'
                          }
                          className="h-[1.15rem] w-[1.15rem] border-[hsl(var(--success)/0.35)] text-primary-foreground transition-colors data-[state=checked]:bg-[hsl(var(--success))]"
                        />
                      </div>
                      <p className="mt-1.5 text-[0.7rem] leading-snug text-muted-foreground">
                        {isCompleted
                          ? 'Если оборудование ещё в работе, снимите отметку.'
                          : isOverdue
                            ? 'Отметьте выдачу или скорректируйте дату, чтобы убрать просрочку.'
                            : 'Отметьте завершение, когда оборудование будет передано.'}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="cardAction"
                      size="card"
                      onClick={() => onEdit(exit)}
                      className={cn(
                        'group w-full justify-start text-left gap-3',
                        'border-[hsl(var(--primary)/0.28)] bg-[linear-gradient(135deg,hsl(var(--primary)/0.12),hsl(var(--primary)/0.04))]',
                        'hover:border-[hsl(var(--primary)/0.42)] hover:bg-[linear-gradient(135deg,hsl(var(--primary)/0.18),hsl(var(--primary)/0.08))] hover:shadow-[0_22px_38px_-18px_hsl(var(--primary)/0.45)]',
                        'dark:bg-[linear-gradient(135deg,hsl(var(--primary)/0.18),hsl(var(--primary)/0.06))] dark:hover:bg-[linear-gradient(135deg,hsl(var(--primary)/0.24),hsl(var(--primary)/0.12))]'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.18)] text-[hsl(var(--primary))] shadow-[0_10px_22px_-18px_hsl(var(--primary)/0.7)] transition-transform duration-200 group-hover:scale-[1.05]',
                          { 'h-8 w-8': isDense }
                        )}
                      >
                        <Edit2 className="h-4 w-4" />
                      </span>
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-semibold leading-none">
                          Редактировать запись
                        </span>
                        <span className="text-[0.7rem] leading-tight text-muted-foreground">
                          Измените дату или оборудование
                        </span>
                      </div>
                    </Button>

                    <Button
                      type="button"
                      variant="cardAction"
                      size="card"
                      onClick={() => handleDelete(exit.id)}
                      className={cn(
                        'group w-full justify-start text-left gap-3',
                        'border-[hsl(var(--destructive)/0.28)] bg-[linear-gradient(135deg,hsl(var(--destructive)/0.12),hsl(var(--destructive)/0.04))]',
                        'hover:border-[hsl(var(--destructive)/0.42)] hover:bg-[linear-gradient(135deg,hsl(var(--destructive)/0.18),hsl(var(--destructive)/0.08))] hover:shadow-[0_22px_38px_-18px_hsl(var(--destructive)/0.45)]',
                        'dark:bg-[linear-gradient(135deg,hsl(var(--destructive)/0.18),hsl(var(--destructive)/0.06))] dark:hover:bg-[linear-gradient(135deg,hsl(var(--destructive)/0.24),hsl(var(--destructive)/0.12))]'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--destructive)/0.18)] text-[hsl(var(--destructive))] shadow-[0_10px_22px_-18px_hsl(var(--destructive)/0.6)] transition-transform duration-200 group-hover:scale-[1.05]',
                          { 'h-8 w-8': isDense }
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                      </span>
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-semibold leading-none text-[hsl(var(--destructive))]">
                          Удалить запись
                        </span>
                        <span className="text-[0.7rem] leading-tight text-muted-foreground">
                          Удаление без возможности восстановления
                        </span>
                      </div>
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
