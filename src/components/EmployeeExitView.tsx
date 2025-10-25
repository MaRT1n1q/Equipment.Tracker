import { AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react'
import { EmployeeExitTable } from './EmployeeExitTable'
import { AddEmployeeExitModal } from './AddEmployeeExitModal'
import { useEmployeeExitsQuery } from '../hooks/useEmployeeExits'
import { Button } from './ui/button'

interface EmployeeExitViewProps {
  isModalOpen: boolean
  onModalOpenChange: (open: boolean) => void
}

export function EmployeeExitView({ isModalOpen, onModalOpenChange }: EmployeeExitViewProps) {
  const { data: exits = [], isLoading, isError, refetch: refetchExits } = useEmployeeExitsQuery()

  // Statistics
  const totalExits = exits.length
  const completedExits = exits.filter((e) => e.is_completed === 1).length
  const pendingExits = exits.filter((e) => e.is_completed === 0).length

  const cards = [
    {
      title: 'Всего записей',
      value: totalExits,
      icon: Users,
      gradient: 'from-orange-500 to-red-500',
      bgLight: 'bg-orange-50',
      bgDark: 'dark:bg-orange-950/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Завершено выдач',
      value: completedExits,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500',
      bgLight: 'bg-green-50',
      bgDark: 'dark:bg-green-950/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Ожидает выдачи',
      value: pendingExits,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
      bgLight: 'bg-amber-50',
      bgDark: 'dark:bg-amber-950/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
  ] as const

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div
            key={card.title}
            className="group relative overflow-hidden rounded-xl bg-card border border-border hover-lift transition-all duration-300 animate-scale-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
            />
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-lg ${card.bgLight} ${card.bgDark} transition-transform duration-300 group-hover:scale-110`}
                >
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <div className="text-right">
                  <div
                    className={`text-3xl font-bold bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent`}
                  >
                    {card.value}
                  </div>
                </div>
              </div>
              <div className="text-sm font-medium text-muted-foreground">{card.title}</div>
            </div>
            <div
              className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}
            />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Список выходов</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Управление записями о выходе сотрудников
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <h3 className="text-lg font-semibold">Не удалось загрузить выходы сотрудников</h3>
              <p className="text-sm text-muted-foreground">
                Повторите попытку. Если ошибка сохраняется, проверьте журнал приложения.
              </p>
            </div>
            <Button onClick={() => refetchExits()} variant="outline">
              Обновить данные
            </Button>
          </div>
        ) : (
          <EmployeeExitTable exits={exits} />
        )}
      </div>

      {/* Add Modal */}
      <AddEmployeeExitModal isOpen={isModalOpen} onClose={() => onModalOpenChange(false)} />
    </div>
  )
}
