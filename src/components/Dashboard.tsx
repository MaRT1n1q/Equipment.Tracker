import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Package,
  PackageCheck,
  Clock,
  TrendingUp,
  UserMinus,
  Users,
  Search,
  AlertTriangle,
} from 'lucide-react'
import { EmployeeExitCalendar } from './EmployeeExitCalendar'
import { Input } from './ui/input'
import { cn } from '../lib/utils'
import { useDebounce } from '../hooks/useDebounce'
import { useEmployeeExitSummaryQuery } from '../hooks/useEmployeeExits'
import { useRequestSummaryQuery } from '../hooks/useRequests'
import { Button } from './ui/button'
import { TableSkeleton } from './TableSkeleton'

export type DashboardSelection = {
  id: number
  searchHint?: string
}

interface DashboardProps {
  onSelectRequest?: (target: DashboardSelection) => void
  onSelectEmployeeExit?: (target: DashboardSelection) => void
}

type SearchResult =
  | {
      type: 'request'
      id: number
      title: string
      description: string
      meta?: string
      searchHint?: string
    }
  | {
      type: 'employeeExit'
      id: number
      title: string
      description: string
      meta?: string
      searchHint?: string
    }

export function Dashboard({ onSelectRequest, onSelectEmployeeExit }: DashboardProps) {
  const {
    data: requestSummary,
    isLoading: isRequestSummaryLoading,
    isError: isRequestSummaryError,
    refetch: refetchRequestSummary,
  } = useRequestSummaryQuery()
  const {
    data: employeeExitSummary,
    isLoading: isEmployeeSummaryLoading,
    isError: isEmployeeSummaryError,
    refetch: refetchEmployeeSummary,
  } = useEmployeeExitSummaryQuery()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(searchQuery, 200)
  const trimmedQuery = debouncedQuery.trim()
  const isSearchEnabled = trimmedQuery.length > 0

  const { data: requestSearchResults } = useQuery({
    queryKey: ['dashboard', 'requestSearch', trimmedQuery],
    queryFn: async () => {
      const response = await window.electronAPI.getRequests({
        search: trimmedQuery,
        page: 1,
        pageSize: 50,
      })

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Не удалось выполнить поиск по заявкам')
      }

      return response.data.items
    },
    enabled: isSearchEnabled,
  })

  const { data: employeeExitSearchResults } = useQuery({
    queryKey: ['dashboard', 'exitSearch', trimmedQuery],
    queryFn: async () => {
      const response = await window.electronAPI.getEmployeeExits({
        search: trimmedQuery,
        page: 1,
        pageSize: 50,
      })

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Не удалось выполнить поиск по выходам')
      }

      return response.data.items
    },
    enabled: isSearchEnabled,
  })

  const returnEvents = useMemo(() => {
    if (!requestSummary) {
      return []
    }

    return requestSummary.returnEvents
      .filter((event) => Boolean(event.return_due_date))
      .map((event) => ({
        id: event.id,
        requestId: event.id,
        employeeName: event.employee_name,
        login: event.login,
        sdNumber: event.sd_number ?? null,
        dueDate: event.return_due_date as string,
        equipmentList:
          event.return_equipment && event.return_equipment.trim().length > 0
            ? event.return_equipment
            : 'Оборудование не указано',
        isCompleted: event.return_completed === 1,
      }))
  }, [requestSummary])

  const requestTotals = requestSummary?.totals ?? {
    total: 0,
    issued: 0,
    notIssued: 0,
    returnPending: 0,
    returnCompleted: 0,
    thisMonth: 0,
  }
  const exitTotals = employeeExitSummary?.totals ?? {
    total: 0,
    completed: 0,
    pending: 0,
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
      value: requestTotals.total,
      icon: Package,
      accent: 'info' as const,
    },
    {
      title: 'Выдано',
      value: requestTotals.issued,
      icon: PackageCheck,
      accent: 'success' as const,
    },
    {
      title: 'В ожидании',
      value: requestTotals.notIssued,
      icon: Clock,
      accent: 'warning' as const,
    },
    {
      title: 'За этот месяц',
      value: requestTotals.thisMonth,
      icon: TrendingUp,
      accent: 'info' as const,
    },
  ]

  const exitCards = [
    {
      title: 'Всего выходов',
      value: exitTotals.total,
      icon: Users,
      accent: 'info' as const,
    },
    {
      title: 'Завершено',
      value: exitTotals.completed,
      icon: PackageCheck,
      accent: 'success' as const,
    },
    {
      title: 'В ожидании',
      value: exitTotals.pending,
      icon: UserMinus,
      accent: 'warning' as const,
    },
  ]

  const searchResults = useMemo<SearchResult[]>(() => {
    const query = trimmedQuery.toLowerCase()

    if (!query) {
      return []
    }

    const requestMatches = (requestSearchResults ?? []).map<SearchResult>((request) => {
      const status =
        request.return_required === 1 ? 'На сдачу' : request.is_issued ? 'Выдано' : 'В ожидании'

      return {
        type: 'request',
        id: request.id,
        title: request.employee_name,
        description: request.sd_number ? `Заявка • SD ${request.sd_number}` : 'Заявка',
        meta: `${status} • ${request.login}`,
        searchHint: request.employee_name,
      }
    })

    const exitMatches = (employeeExitSearchResults ?? []).map<SearchResult>((exit) => {
      const formattedDate = new Date(exit.exit_date).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
      const status = exit.is_completed === 1 ? 'Завершено' : 'Ожидает'

      return {
        type: 'employeeExit',
        id: exit.id,
        title: exit.employee_name,
        description: exit.sd_number
          ? `Выход сотрудника • SD ${exit.sd_number}`
          : 'Выход сотрудника',
        meta: `${status} • ${formattedDate}`,
        searchHint: exit.employee_name,
      }
    })

    return [...requestMatches, ...exitMatches].slice(0, 15)
  }, [trimmedQuery, requestSearchResults, employeeExitSearchResults])

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
      onSelectRequest?.({ id: result.id, searchHint: result.searchHint })
    } else {
      onSelectEmployeeExit?.({ id: result.id, searchHint: result.searchHint })
    }

    setIsSearchOpen(false)
    setSearchQuery('')
  }

  const isLoading = isRequestSummaryLoading || isEmployeeSummaryLoading
  const isError = isRequestSummaryError || isEmployeeSummaryError

  if (isLoading) {
    return <TableSkeleton />
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <AlertTriangle className="h-6 w-6 text-destructive" />
        <div>
          <h3 className="text-lg font-semibold">Не удалось загрузить сводные данные</h3>
          <p className="text-sm text-muted-foreground">
            Попробуйте обновить данные. Если ошибка повторится, проверьте подключение или журнал.
          </p>
        </div>
        <Button
          onClick={() => {
            refetchRequestSummary()
            refetchEmployeeSummary()
          }}
          variant="outline"
        >
          Повторить попытку
        </Button>
      </div>
    )
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

      <EmployeeExitCalendar exits={employeeExitSummary?.exits ?? []} returns={returnEvents} />

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
