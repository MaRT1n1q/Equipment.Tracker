import { AlertTriangle, Download, Info, Search, X } from 'lucide-react'
import { EmployeeExitTable } from './EmployeeExitTable'
import { AddEmployeeExitModal } from './AddEmployeeExitModal'
import { useEmployeeExitsQuery } from '../hooks/useEmployeeExits'
import { Button } from './ui/button'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from './ui/input'
import { useDebounce } from '../hooks/useDebounce'
import { toast } from 'sonner'

const EXIT_TIPS_STORAGE_KEY = 'equipment-tracker:exit-tips-dismissed'
const EXIT_SEARCH_STORAGE_KEY = 'equipment-tracker:exit-search'
const EXIT_FILTER_STORAGE_KEY = 'equipment-tracker:exit-filter'
const EXIT_DENSITY_STORAGE_KEY = 'equipment-tracker:exit-density'

interface EmployeeExitViewProps {
  isModalOpen: boolean
  onModalOpenChange: (open: boolean) => void
}

export function EmployeeExitView({ isModalOpen, onModalOpenChange }: EmployeeExitViewProps) {
  const { data: exits = [], isLoading, isError, refetch: refetchExits } = useEmployeeExitsQuery()
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === 'undefined') {
      return ''
    }

    return localStorage.getItem(EXIT_SEARCH_STORAGE_KEY) ?? ''
  })
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>(() => {
    if (typeof window === 'undefined') {
      return 'all'
    }

    const stored = localStorage.getItem(EXIT_FILTER_STORAGE_KEY)
    if (stored === 'all' || stored === 'completed' || stored === 'pending') {
      return stored
    }

    return 'all'
  })
  const [tableDensity, setTableDensity] = useState<'comfortable' | 'dense'>(() => {
    if (typeof window === 'undefined') {
      return 'comfortable'
    }

    const stored = localStorage.getItem(EXIT_DENSITY_STORAGE_KEY)
    return stored === 'dense' ? 'dense' : 'comfortable'
  })
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [isExporting, setIsExporting] = useState(false)
  const [showQuickHelp, setShowQuickHelp] = useState(() => {
    if (typeof window === 'undefined') {
      return true
    }

    return localStorage.getItem(EXIT_TIPS_STORAGE_KEY) !== 'true'
  })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isPrimaryKey = event.ctrlKey || event.metaKey

      if (!isPrimaryKey) {
        return
      }

      if (event.key.toLowerCase() === 'f') {
        event.preventDefault()

        if (event.shiftKey) {
          setStatusFilter((prev) => (prev === 'pending' ? 'all' : 'pending'))
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

    localStorage.setItem(EXIT_SEARCH_STORAGE_KEY, searchQuery)
  }, [searchQuery])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.setItem(EXIT_FILTER_STORAGE_KEY, statusFilter)
  }, [statusFilter])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    localStorage.setItem(EXIT_DENSITY_STORAGE_KEY, tableDensity)
  }, [tableDensity])

  // Statistics
  const totalExits = exits.length
  const filteredExits = useMemo(() => {
    let list = [...exits]

    if (statusFilter === 'completed') {
      list = list.filter((exit) => exit.is_completed === 1)
    } else if (statusFilter === 'pending') {
      list = list.filter((exit) => exit.is_completed === 0)
    }

    const query = debouncedSearchQuery.trim().toLowerCase()

    if (query) {
      list = list.filter((exit) => {
        const date = new Date(exit.exit_date)
        const formattedDate = date.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })

        return (
          exit.employee_name.toLowerCase().includes(query) ||
          exit.login.toLowerCase().includes(query) ||
          formattedDate.toLowerCase().includes(query) ||
          exit.equipment_list.toLowerCase().includes(query)
        )
      })
    }

    return list
  }, [exits, statusFilter, debouncedSearchQuery])

  const handleExport = async () => {
    if (filteredExits.length === 0) {
      toast.error('Нет записей для экспорта')
      return
    }

    setIsExporting(true)

    try {
      const result = await window.electronAPI.exportEmployeeExits(filteredExits)

      if (result.success) {
        toast.success('CSV-файл сохранён')
      } else if (result.error !== 'Отменено пользователем') {
        toast.error(result.error || 'Не удалось экспортировать данные')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось экспортировать данные')
    } finally {
      setIsExporting(false)
    }
  }

  const dismissQuickHelp = () => {
    setShowQuickHelp(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem(EXIT_TIPS_STORAGE_KEY, 'true')
    }
  }
  return (
    <div className="space-y-6">
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
            <div className="w-12 h-12 border-4 border-[hsl(var(--primary)/0.2)] border-t-[hsl(var(--primary))] rounded-full animate-spin" />
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
          <>
            <div className="space-y-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Поиск по ФИО, логину, дате или оборудованию... (Ctrl+F)"
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
                    variant={statusFilter === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('pending')}
                  >
                    Ожидают
                  </Button>
                  <Button
                    variant={statusFilter === 'completed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('completed')}
                  >
                    Завершены
                  </Button>
                </div>

                <div className="flex items-center gap-3 flex-wrap justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={isExporting || filteredExits.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {isExporting ? 'Экспорт...' : 'Экспорт CSV'}
                  </Button>

                  <span className="status-pill status-pill--info text-xs">
                    {searchQuery || statusFilter !== 'all' ? (
                      <>
                        Найдено{' '}
                        <span className="font-semibold text-foreground">
                          {filteredExits.length}
                        </span>{' '}
                        из {totalExits}
                      </>
                    ) : (
                      <>
                        Всего записей{' '}
                        <span className="font-semibold text-foreground">{totalExits}</span>
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
                  <span>— переключить фильтр &quot;Ожидают&quot;</span>
                </span>
              </div>

              {showQuickHelp && (
                <div className="mt-4 flex flex-wrap items-start gap-3 rounded-lg border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] px-4 py-3 text-sm">
                  <Info className="mt-0.5 h-5 w-5 text-[hsl(var(--primary))]" />
                  <div className="flex-1 space-y-1 text-muted-foreground">
                    <p className="font-medium text-foreground">Секундный onboarding для раздела</p>
                    <ul className="list-disc space-y-1 pl-5">
                      <li>Ctrl+F — моментальный поиск по сотрудникам, логину и оборудованию.</li>
                      <li>
                        Ctrl+Shift+F — переключение фильтра «Ожидают» для массового контроля выдач.
                      </li>
                      <li>Кнопка «Экспорт CSV» сохранит текущий отфильтрованный список.</li>
                      <li>
                        Иконка копирования в каждой записи — переносит список оборудования в буфер.
                      </li>
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

            <EmployeeExitTable
              exits={filteredExits}
              isFiltered={Boolean(searchQuery || statusFilter !== 'all')}
              density={tableDensity}
            />
          </>
        )}
      </div>

      {/* Add Modal */}
      <AddEmployeeExitModal isOpen={isModalOpen} onClose={() => onModalOpenChange(false)} />
    </div>
  )
}
