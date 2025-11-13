import { useEffect, useMemo, useRef, useState } from 'react'
import { Package, PackageCheck, Clock, TrendingUp, UserMinus, Users, Search } from 'lucide-react'
import type { Request } from '../types/ipc'
import { useEmployeeExitsQuery } from '../hooks/useEmployeeExits'
import { EmployeeExitCalendar } from './EmployeeExitCalendar'
import { Input } from './ui/input'
import { cn } from '../lib/utils'
import { useDebounce } from '../hooks/useDebounce'

interface DashboardProps {
  requests: Request[]
  onSelectRequest?: (id: number) => void
  onSelectEmployeeExit?: (id: number) => void
}

type SearchResult =
  | {
      type: 'request'
      id: number
      title: string
      description: string
      meta?: string
    }
  | {
      type: 'employeeExit'
      id: number
      title: string
      description: string
      meta?: string
    }

export function Dashboard({ requests, onSelectRequest, onSelectEmployeeExit }: DashboardProps) {
  const { data: employeeExits = [] } = useEmployeeExitsQuery()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(searchQuery, 200)
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

  const searchResults = useMemo<SearchResult[]>(() => {
    const query = debouncedQuery.trim().toLowerCase()

    if (!query) {
      return []
    }

    const requestMatches = requests.reduce<SearchResult[]>((acc, request) => {
      const equipmentText = (request.equipment_items ?? [])
        .map((item) => `${item.equipment_name} ${item.serial_number ?? ''}`)
        .join(' ')
      const haystack = [
        request.employee_name,
        request.login,
        request.sd_number ?? '',
        request.notes ?? '',
        equipmentText,
      ]
        .join(' ')
        .toLowerCase()

      if (!haystack.includes(query)) {
        return acc
      }

      const status =
        request.return_required === 1 ? 'На сдачу' : request.is_issued ? 'Выдано' : 'В ожидании'

      acc.push({
        type: 'request',
        id: request.id,
        title: request.employee_name,
        description: request.sd_number ? `Заявка • SD ${request.sd_number}` : 'Заявка',
        meta: `${status} • ${request.login}`,
      })

      return acc
    }, [])

    const exitMatches = employeeExits.reduce<SearchResult[]>((acc, exit) => {
      const formattedDate = new Date(exit.exit_date).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
      const haystack = [
        exit.employee_name,
        exit.login,
        exit.sd_number ?? '',
        formattedDate,
        exit.equipment_list,
      ]
        .join(' ')
        .toLowerCase()

      if (!haystack.includes(query)) {
        return acc
      }

      const status = exit.is_completed === 1 ? 'Завершено' : 'Ожидает'

      acc.push({
        type: 'employeeExit',
        id: exit.id,
        title: exit.employee_name,
        description: exit.sd_number
          ? `Выход сотрудника • SD ${exit.sd_number}`
          : 'Выход сотрудника',
        meta: `${status} • ${formattedDate}`,
      })

      return acc
    }, [])

    return [...requestMatches, ...exitMatches].slice(0, 15)
  }, [debouncedQuery, requests, employeeExits])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!searchContainerRef.current) {
        return
      }

      if (!searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleSelectResult = (result: SearchResult) => {
    if (result.type === 'request') {
      onSelectRequest?.(result.id)
    } else {
      onSelectEmployeeExit?.(result.id)
    }

    setIsSearchOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="space-y-8">
      <div ref={searchContainerRef} className="relative">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value)
              setIsSearchOpen(true)
            }}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setIsSearchOpen(false)
                setSearchQuery('')
                return
              }

              if (event.key === 'Enter' && searchResults.length > 0) {
                event.preventDefault()
                handleSelectResult(searchResults[0])
              }
            }}
            placeholder="Поиск по заявкам и выходам сотрудников..."
            className="h-12 rounded-xl bg-muted/40 pl-9 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition focus:border-[hsl(var(--primary)/0.35)] focus:bg-background"
          />
        </div>

        {isSearchOpen && searchQuery.trim().length > 0 && (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border/60 bg-popover shadow-2xl">
            {searchResults.length === 0 ? (
              <div className="px-4 py-5 text-sm text-muted-foreground">Ничего не найдено</div>
            ) : (
              <ul className="max-h-72 overflow-y-auto py-2">
                {searchResults.map((result, index) => (
                  <li
                    key={`${result.type}-${result.id}`}
                    className={cn(
                      'cursor-pointer px-4 py-3 text-sm transition-colors hover:bg-muted/40',
                      index % 2 === 1 && 'bg-muted/10'
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelectResult(result)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                          {result.type === 'request' ? (
                            <Package className="h-4 w-4" />
                          ) : (
                            <UserMinus className="h-4 w-4" />
                          )}
                        </span>
                        <div className="min-w-0 space-y-1">
                          <p className="truncate font-medium text-foreground">{result.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {result.description}
                          </p>
                          {result.meta && (
                            <p className="truncate text-xs text-muted-foreground/80">
                              {result.meta}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground/80 whitespace-nowrap">
                        {result.type === 'request' ? 'Заявка' : 'Выход'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

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
