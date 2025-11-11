import type { Request } from '../types/ipc'
import { Checkbox } from './ui/checkbox'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import {
  Trash2,
  Package,
  FileText,
  Edit2,
  MessageSquare,
  Calendar,
  User,
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
              className="group relative surface-card surface-card-hover overflow-hidden animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${variant.rail}`} />

              <div className={cn('relative p-4 pl-5', { 'p-3 pl-4': isDense })}>
                <div className={cn('flex items-start justify-between gap-4', { 'gap-3': isDense })}>
                  <div className={cn('flex-1 space-y-3', { 'space-y-2.5': isDense })}>
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
                                'text-[hsl(var(--primary))]',
                                isDense ? 'w-3.5 h-3.5' : 'w-4 h-4'
                              )}
                            />
                            <span
                              className={cn('font-semibold', {
                                'text-base': !isDense,
                                'text-sm': isDense,
                              })}
                            >
                              {request.employee_name}
                            </span>
                          </div>
                          <div
                            className={cn(
                              'flex items-center gap-2 text-xs text-muted-foreground',
                              isDense ? 'gap-1.5' : ''
                            )}
                          >
                            <Hash
                              className={cn(
                                'text-muted-foreground',
                                isDense ? 'w-3 h-3' : 'w-3.5 h-3.5'
                              )}
                            />
                            <span>Заявка №{request.id}</span>
                          </div>
                        </div>
                      </div>

                      <span className={cn(variant.pill, isDense && 'px-2.5 py-0.5')}>
                        {isIssued ? 'Выдано' : 'В ожидании'}
                      </span>
                    </div>

                    <div className={cn('flex items-center gap-2 text-sm', { 'text-xs': isDense })}>
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span className="text-muted-foreground">Создана:</span>
                      <span className="font-medium">{formatDate(request.created_at)}</span>
                    </div>

                    {request.issued_at && (
                      <div
                        className={cn(
                          'flex items-center gap-2 text-sm text-[hsl(var(--success))]',
                          {
                            'text-xs gap-1.5': isDense,
                          }
                        )}
                      >
                        <CheckCircle2
                          className={cn('text-current', isDense ? 'w-3 h-3' : 'w-4 h-4')}
                        />
                        <span>Выдано: {formatDate(request.issued_at)}</span>
                      </div>
                    )}

                    {request.notes && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 cursor-help">
                            <MessageSquare className="w-4 h-4" />
                            <span>Есть примечание</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs whitespace-pre-wrap">{request.notes}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    <div className={cn('space-y-2', { 'space-y-1.5': isDense })}>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Package className="w-4 h-4 text-[hsl(var(--primary))]" />
                        <span>Оборудование:</span>
                      </div>
                      {equipmentItems.length > 0 ? (
                        <div className={cn('pl-6 space-y-1.5', { 'pl-5 space-y-1': isDense })}>
                          {equipmentItems.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-start gap-2 text-sm">
                              <span className="text-orange-500 mt-1">•</span>
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">
                                    {item.equipment_name}
                                  </span>
                                  {item.quantity > 1 && (
                                    <span className="status-pill status-pill--info">
                                      ×{item.quantity}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Hash className="w-3 h-3" />
                                  <span className="font-mono">{item.serial_number}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pl-6 text-sm text-muted-foreground">
                          <span className="text-orange-500">•</span>
                          <span>Нет оборудования</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={cn('flex flex-col items-end gap-3', { 'gap-2': isDense })}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isIssued}
                            onCheckedChange={() => handleToggleIssued(request.id, isIssued)}
                            className="w-5 h-5"
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            Выдано
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isIssued ? 'Отменить выдачу' : 'Отметить как выданное'}</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(request)}
                          className={cn(
                            'text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.12)]',
                            isDense ? 'h-8 w-8' : 'h-9 w-9'
                          )}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Редактировать заявку</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(request.id)}
                          className={cn(
                            'text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.12)]',
                            isDense ? 'h-8 w-8' : 'h-9 w-9'
                          )}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Удалить заявку</p>
                      </TooltipContent>
                    </Tooltip>
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
