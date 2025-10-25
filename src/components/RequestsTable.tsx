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
  const cardPadding = isDense ? 'p-3 pl-4' : 'p-4 pl-5'
  const headerGap = isDense ? 'gap-2' : 'gap-3'
  const equipmentListSpacing = isDense ? 'mt-2 space-y-1' : 'mt-3 space-y-2'
  const metadataRowClasses = cn(
    'flex items-center text-muted-foreground',
    isDense ? 'gap-3 mt-2 text-[11px]' : 'gap-4 mt-3 text-xs'
  )

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
    <div className={cn('space-y-3', { 'space-y-2': isDense })}>
      <TooltipProvider>
        {requests.map((request, index) => {
          const statusIndicatorClass = request.is_issued
            ? 'bg-[linear-gradient(180deg,hsl(var(--success))0%,hsl(var(--success)/0.6)100%)]'
            : 'bg-[linear-gradient(180deg,hsl(var(--warning))0%,hsl(var(--warning)/0.6)100%)]'

          return (
            <div
              key={request.id}
              className="group relative surface-card surface-card-hover overflow-hidden animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Status indicator */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusIndicatorClass}`} />

              {/* Hover gradient effect */}
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity duration-300" />

              <div className={`relative ${cardPadding}`}>
                <div className={`flex items-center justify-between ${isDense ? 'gap-3' : 'gap-4'}`}>
                  {/* Left section - ID and Status */}
                  <div className={`flex items-center ${headerGap} min-w-0`}>
                    {' '}
                    {/* gap dynamic */}
                    {/* ID Badge */}
                    <div className="status-pill status-pill--info flex-shrink-0">
                      <Hash className="w-3.5 h-3.5" />
                      <span className="text-sm font-semibold text-foreground">{request.id}</span>
                    </div>
                    {/* Status Badge */}
                    {request.is_issued ? (
                      <span className="status-pill status-pill--success">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Выдано</span>
                      </span>
                    ) : (
                      <span className="status-pill status-pill--warning">
                        <Clock className="w-3.5 h-3.5" />
                        <span>В ожидании</span>
                      </span>
                    )}
                    {/* Employee name */}
                    <div className={`flex items-center ${isDense ? 'gap-1.5' : 'gap-2'} min-w-0`}>
                      <User
                        className={`flex-shrink-0 ${isDense ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-[hsl(var(--primary))]`}
                      />
                      <span className={`${isDense ? 'text-sm' : 'text-sm'} font-semibold truncate`}>
                        {request.employee_name}
                      </span>
                    </div>
                  </div>

                  {/* Right section - Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={Boolean(request.is_issued)}
                            onCheckedChange={() =>
                              handleToggleIssued(request.id, Boolean(request.is_issued))
                            }
                            className="w-4 h-4"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {request.is_issued ? 'Отменить выдачу' : 'Отметить как выданное'}
                        </p>
                      </TooltipContent>
                    </Tooltip>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(request)}
                      className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(request.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Equipment items list */}
                <div className={equipmentListSpacing}>
                  {request.equipment_items && request.equipment_items.length > 0 ? (
                    request.equipment_items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className={cn(
                          'flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/30',
                          isDense ? 'p-1.5 text-xs' : 'p-2 text-sm'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Package className="w-3.5 h-3.5 text-[hsl(var(--primary))] flex-shrink-0" />
                            <span className="font-medium truncate">{item.equipment_name}</span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Hash className="w-3 h-3 text-muted-foreground" />
                            <span className="font-mono text-xs text-muted-foreground">
                              {item.serial_number}
                            </span>
                          </div>
                        </div>

                        {item.quantity > 1 && (
                          <div className="status-pill status-pill--info flex-shrink-0">
                            <span className="text-xs font-semibold">×{item.quantity}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 text-sm text-muted-foreground">
                      <Package className="w-3.5 h-3.5" />
                      <span>Нет оборудования</span>
                    </div>
                  )}
                </div>

                {/* Dates row */}
                <div className={metadataRowClasses}>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(request.created_at)}</span>
                  </div>
                  {request.issued_at && (
                    <div className="flex items-center gap-1 text-[hsl(var(--success))]">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Выдано: {formatDate(request.issued_at)}</span>
                    </div>
                  )}

                  {/* Notes indicator */}
                  {request.notes && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 cursor-help">
                          <MessageSquare className="w-3 h-3" />
                          <span>Примечания</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs whitespace-pre-wrap">{request.notes}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </TooltipProvider>
    </div>
  )
}
