import type { EmployeeExit } from '../types/ipc'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
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
} from 'lucide-react'
import { toast } from 'sonner'
import { useEmployeeExitActions } from '../hooks/useEmployeeExits'
import { cn } from '../lib/utils'

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
                          <span className={cn('font-semibold', isDense ? 'text-base' : 'text-lg')}>
                            {exit.employee_name}
                          </span>
                        </div>
                        <div
                          className={cn('flex items-center gap-2 text-sm text-muted-foreground', {
                            'gap-1.5 text-xs': isDense,
                          })}
                        >
                          <KeyRound
                            className={cn(
                              'text-muted-foreground',
                              isDense ? 'w-3 h-3' : 'w-3.5 h-3.5'
                            )}
                          />
                          <span>{exit.login}</span>
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
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Package className="w-4 h-4 text-[hsl(var(--primary))]" />
                      <span>Оборудование для выдачи:</span>
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
                <div className={cn('flex flex-col items-end gap-3', { 'gap-2': isDense })}>
                  {/* Completed Checkbox */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isCompleted}
                            onCheckedChange={() => handleToggleCompleted(exit.id, isCompleted)}
                            className="w-5 h-5"
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            Выдано
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Отметить как выданное/невыданное</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Edit Button */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(exit)}
                          className={cn(
                            'text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.12)]',
                            isDense ? 'h-8 w-8' : ''
                          )}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Редактировать запись</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Copy Equipment */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyEquipment(equipmentItems, exit.employee_name)}
                          className={cn(
                            'text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.12)]',
                            isDense ? 'h-8 w-8' : ''
                          )}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Скопировать список оборудования</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Delete Button */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(exit.id)}
                          className={cn(
                            'text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.12)]',
                            isDense ? 'h-8 w-8' : ''
                          )}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Удалить запись</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
