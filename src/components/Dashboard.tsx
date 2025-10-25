import { Package, PackageCheck, Clock, TrendingUp, UserMinus, Users } from 'lucide-react'
import type { Request } from '../types/ipc'
import { useEmployeeExitsQuery } from '../hooks/useEmployeeExits'

interface DashboardProps {
  requests: Request[]
}

export function Dashboard({ requests }: DashboardProps) {
  const { data: employeeExits = [] } = useEmployeeExitsQuery()
  const stats = {
    total: requests.length,
    issued: requests.filter((r) => r.is_issued === 1).length,
    notIssued: requests.filter((r) => r.is_issued === 0).length,
    thisMonth: requests.filter((r) => {
      const date = new Date(r.created_at)
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length,
    // Employee exits stats
    totalExits: employeeExits.length,
    completedExits: employeeExits.filter((e) => e.is_completed === 1).length,
    pendingExits: employeeExits.filter((e) => e.is_completed === 0).length,
  }

  const cards = [
    {
      title: 'Всего заявок',
      value: stats.total,
      icon: Package,
      gradient: 'from-blue-500 to-cyan-500',
      bgLight: 'bg-blue-50',
      bgDark: 'dark:bg-blue-950/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Выдано',
      value: stats.issued,
      icon: PackageCheck,
      gradient: 'from-green-500 to-emerald-500',
      bgLight: 'bg-green-50',
      bgDark: 'dark:bg-green-950/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'В ожидании',
      value: stats.notIssued,
      icon: Clock,
      gradient: 'from-orange-500 to-amber-500',
      bgLight: 'bg-orange-50',
      bgDark: 'dark:bg-orange-950/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'За этот месяц',
      value: stats.thisMonth,
      icon: TrendingUp,
      gradient: 'from-purple-500 to-pink-500',
      bgLight: 'bg-purple-50',
      bgDark: 'dark:bg-purple-950/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ]

  const exitCards = [
    {
      title: 'Всего выходов',
      value: stats.totalExits,
      icon: Users,
      gradient: 'from-orange-500 to-red-500',
      bgLight: 'bg-orange-50',
      bgDark: 'dark:bg-orange-950/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Завершено',
      value: stats.completedExits,
      icon: PackageCheck,
      gradient: 'from-green-500 to-emerald-500',
      bgLight: 'bg-green-50',
      bgDark: 'dark:bg-green-950/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'В ожидании',
      value: stats.pendingExits,
      icon: UserMinus,
      gradient: 'from-red-500 to-rose-500',
      bgLight: 'bg-red-50',
      bgDark: 'dark:bg-red-950/20',
      iconColor: 'text-red-600 dark:text-red-400',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Requests Section */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-500" />
          Статистика заявок
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => (
            <div
              key={card.title}
              className="group relative overflow-hidden rounded-xl bg-card border border-border hover-lift transition-all duration-300 animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient background on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
              />

              {/* Content */}
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

              {/* Bottom accent line */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Employee Exits Section */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <UserMinus className="w-5 h-5 text-orange-500" />
          Статистика выходов сотрудников
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {exitCards.map((card, index) => (
            <div
              key={card.title}
              className="group relative overflow-hidden rounded-xl bg-card border border-border hover-lift transition-all duration-300 animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient background on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
              />

              {/* Content */}
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

              {/* Bottom accent line */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
