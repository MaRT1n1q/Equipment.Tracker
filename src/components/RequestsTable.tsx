import { Request } from '../types/electron.d'
import { Checkbox } from './ui/checkbox'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { Trash2, Package, FileText, Edit2, MessageSquare, Calendar, User, Hash, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface RequestsTableProps {
  requests: Request[]
  onUpdate: () => void
  onEdit: (request: Request) => void
}

export function RequestsTable({ requests, onUpdate, onEdit }: RequestsTableProps) {
  const handleToggleIssued = async (id: number, currentStatus: boolean) => {
    try {
      const result = await window.electronAPI.updateIssued(id, !currentStatus)
      
      if (result.success) {
        toast.success(!currentStatus ? 'Оборудование отмечено как выданное' : 'Статус отменен')
        onUpdate()
      } else {
        toast.error(result.error || 'Ошибка при обновлении статуса')
      }
    } catch (error) {
      toast.error('Произошла ошибка')
      console.error(error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const result = await window.electronAPI.deleteRequest(id)
      
      if (result.success && result.data) {
        const deletedRequest = result.data
        
        // Обновить список
        onUpdate()
        
        // Показать toast с кнопкой отмены
        toast.success('Заявка удалена', {
          action: {
            label: 'Отменить',
            onClick: async () => {
              try {
                const restoreResult = await window.electronAPI.restoreRequest(deletedRequest)
                if (restoreResult.success) {
                  toast.success('Заявка восстановлена')
                  onUpdate()
                } else {
                  toast.error('Ошибка при восстановлении')
                }
              } catch (error) {
                toast.error('Ошибка при восстановлении')
                console.error(error)
              }
            }
          },
          duration: 5000,
        })
      } else {
        toast.error(result.error || 'Ошибка при удалении заявки')
      }
    } catch (error) {
      toast.error('Произошла ошибка')
      console.error(error)
    }
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          Создайте первую заявку на выдачу оборудования, нажав кнопку "Добавить заявку" или используя{' '}
          <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">Ctrl+N</kbd>
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
    <div className="space-y-4">
      <TooltipProvider>
        {requests.map((request, index) => (
          <div
            key={request.id}
            className="group relative bg-card rounded-xl border border-border hover:border-primary/50 transition-all duration-300 hover-lift overflow-hidden animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Status indicator */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              request.is_issued 
                ? 'bg-gradient-to-b from-green-500 to-emerald-500' 
                : 'bg-gradient-to-b from-orange-500 to-amber-500'
            }`} />
            
            {/* Hover gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative p-6">
              <div className="flex items-start justify-between gap-4">
                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-4">
                    {/* ID Badge */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary">
                      <Hash className="w-4 h-4" />
                      <span className="text-sm font-semibold">{request.id}</span>
                    </div>
                    
                    {/* Status Badge */}
                    {request.is_issued ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Выдано</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">В ожидании</span>
                      </div>
                    )}
                  </div>

                  {/* Employee name */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Сотрудник</div>
                      <div className="text-base font-semibold">{request.employee_name}</div>
                    </div>
                  </div>

                  {/* Equipment info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-purple-500" />
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">Оборудование</div>
                        <div className="text-sm font-medium truncate">{request.equipment_name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">Серийный номер</div>
                        <div className="text-sm font-mono">{request.serial_number}</div>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Создано: {formatDate(request.created_at)}</span>
                    </div>
                    {request.issued_at && (
                      <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Выдано: {formatDate(request.issued_at)}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {request.notes && (
                    <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground mb-1">Примечания</div>
                          <div className="text-sm whitespace-pre-wrap break-words">{request.notes}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={Boolean(request.is_issued)}
                          onCheckedChange={() => handleToggleIssued(request.id, Boolean(request.is_issued))}
                          className="w-5 h-5"
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
                    className="text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(request.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </TooltipProvider>
    </div>
  )
}
