import { useMemo } from 'react'
import { Package, PackageCheck, Clock, TrendingUp, UserMinus, Users } from 'lucide-react'
import type { Request } from '../types/ipc'
import { useEmployeeExitsQuery } from '../hooks/useEmployeeExits'
import { EmployeeExitCalendar } from './EmployeeExitCalendar'

interface DashboardProps {
  requests: Request[]
}

export function Dashboard({ requests }: DashboardProps) {
  const { data: employeeExits = [] } = useEmployeeExitsQuery()
  const returnEvents = useMemo(
    () =>
      requests
        .filter((request) => request.return_required === 1 && Boolean(request.return_due_date))
        .map((request) => ({
          id: request.id,
          requestId: request.id,
          employeeName: request.employee_name,
          login: request.login,
          sdNumber: request.sd_number ?? null,
          dueDate: request.return_due_date as string,
          equipmentList:
            request.return_equipment && request.return_equipment.trim().length > 0
              ? request.return_equipment
              : buildEquipmentFallback(request),
          isCompleted: request.return_completed === 1,
        })),
    [requests]
  )
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

  const accentStyles = {
    info: {
      icon: 'status-icon status-icon--info',
      underline: 'bg-[hsl(var(--primary))] dark:bg-[hsl(var(--primary))]',
    },
    success: {
      icon: 'status-icon status-icon--success',
      underline: 'bg-[hsl(var(--success))] dark:bg-[hsl(var(--success))]',
    },
    warning: {
      icon: 'status-icon status-icon--warning',
      underline: 'bg-[hsl(var(--warning))] dark:bg-[hsl(var(--warning))]',
    },
    danger: {
      icon: 'status-icon status-icon--danger',
      underline: 'bg-[hsl(var(--destructive))] dark:bg-[hsl(var(--destructive))]',
    },
  }

  const cards = [
    {
      title: 'Всего заявок',
      value: stats.total,
      icon: Package,
      accent: 'info' as const,
    },
    {
      title: 'Выдано',
      value: stats.issued,
      icon: PackageCheck,
      accent: 'success' as const,
    },
    {
      title: 'В ожидании',
      value: stats.notIssued,
      icon: Clock,
      accent: 'warning' as const,
    },
    {
      title: 'За этот месяц',
      value: stats.thisMonth,
      icon: TrendingUp,
      accent: 'info' as const,
    },
  ]

  const exitCards = [
    {
      title: 'Всего выходов',
      value: stats.totalExits,
      icon: Users,
      accent: 'info' as const,
    },
    {
      title: 'Завершено',
      value: stats.completedExits,
      icon: PackageCheck,
      accent: 'success' as const,
    },
    {
      title: 'В ожидании',
      value: stats.pendingExits,
      icon: UserMinus,
      accent: 'warning' as const,
    },
  ]

  return (
    <div className="space-y-8">
      <EmployeeExitCalendar exits={employeeExits} returns={returnEvents} />

      {/* Requests Section */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-[hsl(var(--primary))]" />
          Статистика заявок
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => {
            const accent = accentStyles[card.accent]

            return (
              <div
                key={card.title}
                className="group relative surface-card surface-card-hover overflow-hidden animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`${accent.icon} transition-transform duration-300 group-hover:scale-105`}
                    >
                      <card.icon className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-bold text-foreground">{card.value}</div>
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">{card.title}</div>
                </div>
                <div className={`absolute inset-x-0 bottom-0 h-1 ${accent.underline}`} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Employee Exits Section */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <UserMinus className="w-5 h-5 text-[hsl(var(--primary))]" />
          Статистика выходов сотрудников
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {exitCards.map((card, index) => {
            const accent = accentStyles[card.accent]

            return (
              <div
                key={card.title}
                className="group relative surface-card surface-card-hover overflow-hidden animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`${accent.icon} transition-transform duration-300 group-hover:scale-105`}
                    >
                      <card.icon className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-bold text-foreground">{card.value}</div>
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">{card.title}</div>
                </div>
                <div className={`absolute inset-x-0 bottom-0 h-1 ${accent.underline}`} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function buildEquipmentFallback(request: Request): string {
  if (!request.equipment_items || request.equipment_items.length === 0) {
    return 'Оборудование не указано'
  }

  return request.equipment_items
    .map((item) => {
      const base = item.equipment_name
      const serial = item.serial_number ? ` — ${item.serial_number}` : ''
      const quantity = item.quantity > 1 ? ` ×${item.quantity}` : ''
      return `${base}${serial}${quantity}`
    })
    .join('\n')
}
