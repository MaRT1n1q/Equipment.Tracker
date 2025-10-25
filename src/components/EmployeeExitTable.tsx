import { EmployeeExit } from '../types/electron.d'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { Trash2, UserMinus, Calendar, User, KeyRound, Package, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface EmployeeExitTableProps {
  exits: EmployeeExit[]
  onUpdate: () => void
}

export function EmployeeExitTable({ exits, onUpdate }: EmployeeExitTableProps) {
  const handleToggleCompleted = async (id: number, currentStatus: boolean) => {
    try {
      const result = await window.electronAPI.updateExitCompleted(id, !currentStatus)
      
      if (result.success) {
        toast.success(!currentStatus ? 'Выдача оборудования отмечена как завершённая' : 'Статус отменен')
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
    const confirmed = window.confirm('Удалить запись о выходе сотрудника? Действие необратимо без резервной копии.')
    if (!confirmed) {
      return
    }

    try {
      const result = await window.electronAPI.deleteEmployeeExit(id)
      
      if (result.success) {
        toast.success('Запись удалена')
        onUpdate()
      } else {
        toast.error(result.error || 'Ошибка при удалении записи')
      }
    } catch (error) {
      toast.error('Произошла ошибка')
      console.error(error)
    }
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  if (exits.length === 0) {
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
    <div className="space-y-4">
      {exits.map((exit, index) => {
        const isCompleted = exit.is_completed === 1
        const equipmentItems = exit.equipment_list.split('\n').filter(item => item.trim())
        
        return (
          <div
            key={exit.id}
            className="group relative bg-card rounded-lg border border-border hover:border-orange-500/50 transition-all duration-300 hover:shadow-md overflow-hidden animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Status gradient bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
              isCompleted 
                ? 'bg-gradient-to-b from-green-500 to-emerald-500' 
                : 'bg-gradient-to-b from-orange-500 to-red-500'
            }`} />

            <div className="p-4 pl-5">
              <div className="flex items-start justify-between gap-4">
                {/* Main Info */}
                <div className="flex-1 space-y-3">
                  {/* Employee Name & Status */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-lg ${
                        isCompleted 
                          ? 'bg-green-500/10' 
                          : 'bg-gradient-to-br from-orange-500/10 to-red-500/10'
                      } flex items-center justify-center`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold text-lg">{exit.employee_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>{exit.login}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isCompleted
                        ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20'
                        : 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20'
                    }`}>
                      {isCompleted ? 'Завершено' : 'Ожидает'}
                    </span>
                  </div>

                  {/* Exit Date */}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    <span className="text-muted-foreground">Дата выхода:</span>
                    <span className="font-medium">{formatDate(exit.exit_date)}</span>
                  </div>

                  {/* Equipment List */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Package className="w-4 h-4 text-orange-500" />
                      <span>Оборудование для выдачи:</span>
                    </div>
                    <div className="pl-6 space-y-1">
                      {equipmentItems.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-orange-500 mt-1">•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-3">
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

                  {/* Delete Button */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(exit.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
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
