import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Info, Search, X } from 'lucide-react'
import type { Request } from '../types/ipc'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useDebounce } from '../hooks/useDebounce'
import { RequestsTable } from './RequestsTable'

const REQUESTS_SEARCH_STORAGE_KEY = 'equipment-tracker:requests-search'
const REQUESTS_FILTER_STORAGE_KEY = 'equipment-tracker:requests-filter'
const REQUESTS_DENSITY_STORAGE_KEY = 'equipment-tracker:requests-density'
const REQUESTS_TIPS_STORAGE_KEY = 'equipment-tracker:requests-tips-dismissed'

type RequestFilter = 'all' | 'issued' | 'not-issued'

type TableDensity = 'comfortable' | 'dense'

interface RequestsViewProps {
  requests: Request[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onEdit: (request: Request) => void
}

export function RequestsView({ requests, isLoading, isError, onRetry, onEdit }: RequestsViewProps) {
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === 'undefined') {
      return ''
    }

    return localStorage.getItem(REQUESTS_SEARCH_STORAGE_KEY) ?? ''
  })
  const [statusFilter, setStatusFilter] = useState<RequestFilter>(() => {
    if (typeof window === 'undefined') {
      return 'all'
    }

    const stored = localStorage.getItem(REQUESTS_FILTER_STORAGE_KEY)
    if (stored === 'all' || stored === 'issued' || stored === 'not-issued') {
      return stored
    }

    return 'all'
  })
  const [tableDensity, setTableDensity] = useState<TableDensity>(() => {
    if (typeof window === 'undefined') {
      return 'comfortable'
    }

    const stored = localStorage.getItem(REQUESTS_DENSITY_STORAGE_KEY)
    return stored === 'dense' ? 'dense' : 'comfortable'
  })
  const [showQuickHelp, setShowQuickHelp] = useState(() => {
    if (typeof window === 'undefined') {
      return true
    }

    return localStorage.getItem(REQUESTS_TIPS_STORAGE_KEY) !== 'true'
  })
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isPrimaryKey = event.ctrlKey || event.metaKey

      if (!isPrimaryKey) {
        return
      }

      if (event.key.toLowerCase() === 'f') {
        event.preventDefault()

        if (event.shiftKey) {
          setStatusFilter((prev) => (prev === 'not-issued' ? 'all' : 'not-issued'))
        }

        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.setItem(REQUESTS_SEARCH_STORAGE_KEY, searchQuery)
  }, [searchQuery])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.setItem(REQUESTS_FILTER_STORAGE_KEY, statusFilter)
  }, [statusFilter])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.setItem(REQUESTS_DENSITY_STORAGE_KEY, tableDensity)
  }, [tableDensity])

  const filteredRequests = useMemo(() => {
    let filtered = [...requests]

    if (statusFilter === 'issued') {
      filtered = filtered.filter((request) => request.is_issued === 1)
    } else if (statusFilter === 'not-issued') {
      filtered = filtered.filter((request) => request.is_issued === 0)
    }

    const query = debouncedSearchQuery.trim().toLowerCase()

    if (query) {
      filtered = filtered.filter((request) => {
        if (request.employee_name.toLowerCase().includes(query)) {
          return true
        }

        if (
          request.equipment_items &&
          request.equipment_items.some(
            (item) =>
              item.equipment_name.toLowerCase().includes(query) ||
              item.serial_number.toLowerCase().includes(query)
          )
        ) {
          return true
        }

        return false
      })
    }

    return filtered
  }, [requests, statusFilter, debouncedSearchQuery])

  const dismissQuickHelp = () => {
    setShowQuickHelp(false)

    if (typeof window !== 'undefined') {
      localStorage.setItem(REQUESTS_TIPS_STORAGE_KEY, 'true')
    }
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-[hsl(var(--primary)/0.2)] border-t-[hsl(var(--primary))] rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <div>
            <h3 className="text-lg font-semibold">Не удалось загрузить заявки</h3>
            <p className="text-sm text-muted-foreground">
              Повторите попытку. Если ошибка не исчезнет, проверьте журнал приложения.
            </p>
          </div>
          <Button onClick={onRetry} variant="outline">
            Обновить данные
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Поиск по ФИО, оборудованию или серийному номеру... (Ctrl+F)"
                className="pl-10"
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  Все
                </Button>
                <Button
                  variant={statusFilter === 'not-issued' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('not-issued')}
                >
                  Не выданные
                </Button>
                <Button
                  variant={statusFilter === 'issued' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('issued')}
                >
                  Выданные
                </Button>
              </div>

              <div className="flex items-center gap-3 flex-wrap justify-end">
                <span className="status-pill status-pill--info text-xs">
                  {searchQuery || statusFilter !== 'all' ? (
                    <>
                      Найдено{' '}
                      <span className="font-semibold text-foreground">
                        {filteredRequests.length}
                      </span>{' '}
                      из {requests.length}
                    </>
                  ) : (
                    <>
                      Всего заявок{' '}
                      <span className="font-semibold text-foreground">{requests.length}</span>
                    </>
                  )}
                </span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Отображение</span>
                  <div className="inline-flex rounded-full border border-border bg-background/80 p-0.5">
                    <Button
                      size="sm"
                      variant={tableDensity === 'comfortable' ? 'default' : 'ghost'}
                      className={`h-7 rounded-full px-3 text-xs ${tableDensity === 'comfortable' ? '' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setTableDensity('comfortable')}
                    >
                      Обычный
                    </Button>
                    <Button
                      size="sm"
                      variant={tableDensity === 'dense' ? 'default' : 'ghost'}
                      className={`h-7 rounded-full px-3 text-xs ${tableDensity === 'dense' ? '' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setTableDensity('dense')}
                    >
                      Компактный
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border bg-muted">Ctrl</kbd>+
                <kbd className="px-1.5 py-0.5 rounded border bg-muted">F</kbd>
                <span>— фокус на поиске</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border bg-muted">Ctrl</kbd>+
                <kbd className="px-1.5 py-0.5 rounded border bg-muted">Shift</kbd>+
                <kbd className="px-1.5 py-0.5 rounded border bg-muted">F</kbd>
                <span>— переключить фильтр «Не выданные»</span>
              </span>
            </div>

            {showQuickHelp && (
              <div className="mt-4 flex flex-wrap items-start gap-3 rounded-lg border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] px-4 py-3 text-sm">
                <Info className="mt-0.5 h-5 w-5 text-[hsl(var(--primary))]" />
                <div className="flex-1 space-y-1 text-muted-foreground">
                  <p className="font-medium text-foreground">Секундный onboarding для раздела</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Ctrl+N — моментальное создание новой заявки.</li>
                    <li>Ctrl+F — поиск по сотруднику, оборудованию и серийному номеру.</li>
                    <li>Фильтр «Не выданные» помогает отслеживать ожидающие заявки.</li>
                    <li>Кнопка редактирования и чекбокс статуса всегда под рукой.</li>
                  </ul>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={dismissQuickHelp}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <RequestsTable requests={filteredRequests} onEdit={onEdit} density={tableDensity} />
        </>
      )}
    </div>
  )
}
