import { Download, Plus } from 'lucide-react'
import { EmployeeExitTable } from './EmployeeExitTable'
import { AddEmployeeExitModal } from './AddEmployeeExitModal'
import { EditEmployeeExitModal } from './EditEmployeeExitModal'
import { useEmployeeExitSummaryQuery, useEmployeeExitsQuery } from '../hooks/useEmployeeExits'
import { Button } from './ui/button'
import { useEffect, useRef, useState, useMemo } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { toast } from 'sonner'
import { SearchAndFilters } from './SearchAndFilters'
import { usePersistentState } from '../hooks/usePersistentState'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'
import type { EmployeeExit } from '../types/ipc'
import { ListPagination } from './ListPagination'
import { PageHeader } from './PageHeader'

import { ErrorState } from './ErrorState'
import { EmployeeExitSkeleton } from './EmployeeExitSkeleton'
import { fetchEmployeeExits } from '../lib/api/employeeExits'

const EXIT_TIPS_STORAGE_KEY = 'equipment-tracker:exit-tips-dismissed'
const EXIT_SEARCH_STORAGE_KEY = 'equipment-tracker:exit-search'
const EXIT_FILTER_STORAGE_KEY = 'equipment-tracker:exit-filter'
const EXIT_PAGE_SIZE_STORAGE_KEY = 'equipment-tracker:exit-page-size'
const EXIT_PAGE_SIZE_OPTIONS = [25, 50, 100]
const DEFAULT_EXIT_PAGE_SIZE = 25

interface EmployeeExitViewProps {
  isModalOpen: boolean
  onModalOpenChange: (open: boolean) => void
  highlightExitId?: number | null
  highlightSearchQuery?: string | null
  onHighlightConsumed?: () => void
  cityOverride?: string
}

export type EmployeeExitSelection = {
  id: number
  searchHint?: string
}

export function EmployeeExitView({
  isModalOpen,
  onModalOpenChange,
  highlightExitId,
  highlightSearchQuery,
  onHighlightConsumed,
  cityOverride,
}: EmployeeExitViewProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [selectedExit, setSelectedExit] = useState<EmployeeExit | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = usePersistentState<string>(EXIT_SEARCH_STORAGE_KEY, '', {
    serializer: (value) => value,
    deserializer: (value) => value,
  })
  const [statusFilter, setStatusFilter] = usePersistentState<'all' | 'completed' | 'pending'>(
    EXIT_FILTER_STORAGE_KEY,
    'all',
    {
      serializer: (value) => value,
      deserializer: (value) =>
        value === 'completed' || value === 'pending' || value === 'all'
          ? (value as 'all' | 'completed' | 'pending')
          : 'all',
    }
  )
  const tableDensity = 'dense' as const
  const [isExporting, setIsExporting] = useState(false)
  const [showQuickHelp, setShowQuickHelp] = usePersistentState<boolean>(
    EXIT_TIPS_STORAGE_KEY,
    true,
    {
      serializer: (value) => (value ? 'visible' : 'hidden'),
      deserializer: (value) => value !== 'true' && value !== 'hidden' && value !== '0',
    }
  )
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = usePersistentState<number>(
    EXIT_PAGE_SIZE_STORAGE_KEY,
    DEFAULT_EXIT_PAGE_SIZE,
    {
      serializer: (value) => String(value),
      deserializer: (value) => {
        const next = Number(value)
        return Number.isFinite(next) && EXIT_PAGE_SIZE_OPTIONS.includes(next)
          ? next
          : DEFAULT_EXIT_PAGE_SIZE
      },
    }
  )
  const isFiltered = Boolean(debouncedSearchQuery.trim() || statusFilter !== 'all')

  const listParams = useMemo(
    () => ({
      page,
      pageSize,
      search: debouncedSearchQuery.trim() ? debouncedSearchQuery.trim() : undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    [page, pageSize, debouncedSearchQuery, statusFilter]
  )

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch: refetchExits,
  } = useEmployeeExitsQuery(listParams, cityOverride)
  const { data: exitSummary } = useEmployeeExitSummaryQuery(cityOverride)
  const exits = data?.items ?? []
  const meta = data?.meta ?? {
    page,
    pageSize,
    total: 0,
    pageCount: 1,
    hasMore: false,
  }
  const serverPage = data?.meta?.page

  useEffect(() => {
    if (typeof serverPage === 'number' && serverPage !== page) {
      setPage(serverPage)
    }
  }, [serverPage, page])

  useEffect(() => {
    if (!highlightExitId) {
      return
    }

    if (statusFilter !== 'all') {
      setStatusFilter('all')
    }

    if (searchQuery !== '') {
      setSearchQuery('')
    }
    setPage(1)
  }, [highlightExitId, statusFilter, setStatusFilter, searchQuery, setSearchQuery])

  useEffect(() => {
    if (!highlightExitId) {
      return
    }

    if (highlightSearchQuery !== undefined && highlightSearchQuery !== null) {
      setSearchQuery(highlightSearchQuery)
    }
  }, [highlightExitId, highlightSearchQuery, setSearchQuery])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearchQuery, statusFilter, pageSize])

  useKeyboardShortcut(
    { key: 'f', ctrlKey: true, shiftKey: true },
    () => {
      setStatusFilter((current) => (current === 'pending' ? 'all' : 'pending'))
    },
    [setStatusFilter]
  )

  useKeyboardShortcut(
    { key: 'f', ctrlKey: true },
    () => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    },
    [searchInputRef]
  )

  const fetchAllFilteredExits = async (): Promise<EmployeeExit[]> => {
    const collected: EmployeeExit[] = []
    const pageSizeForExport = 100
    let nextPage = 1

    while (true) {
      const response = await fetchEmployeeExits({
        page: nextPage,
        pageSize: pageSizeForExport,
        search: searchQuery.trim() ? searchQuery.trim() : undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      })

      collected.push(...response.items)

      if (!response.meta.hasMore) {
        break
      }

      nextPage += 1

      if (nextPage > response.meta.pageCount) {
        break
      }
    }

    return collected
  }

  const exportToCsv = (data: EmployeeExit[]) => {
    const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`
    const headers = ['ФИО', 'Логин', 'Дата выхода', 'Оборудование', 'Статус']
    const rows = data.map((exit) => [
      escapeCell(exit.employee_name),
      escapeCell(exit.login),
      escapeCell(exit.exit_date ?? ''),
      escapeCell(exit.equipment_list),
      escapeCell(exit.is_completed === 1 ? 'Завершён' : 'Ожидает'),
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `employee-exits-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const exportData = await fetchAllFilteredExits()

      if (exportData.length === 0) {
        toast.error('Нет записей для экспорта')
        return
      }

      exportToCsv(exportData)
      toast.success('CSV-файл сохранён')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось экспортировать данные')
    } finally {
      setIsExporting(false)
    }
  }

  const dismissQuickHelp = () => {
    setShowQuickHelp(false)
    // Removed localStorage management
  }

  const handleEdit = (exit: EmployeeExit) => {
    setSelectedExit(exit)
    setIsEditModalOpen(true)
  }

  const handleEditModalClose = () => {
    setIsEditModalOpen(false)
    setSelectedExit(null)
  }
  return (
    <div className="space-y-6">
      {/* Table */}
      <div className="space-y-6">
        <PageHeader
          title="Выход сотрудников"
          description="Учёт выдачи оборудования сотрудникам и контроль сроков."
          actions={
            <Button
              onClick={() => onModalOpenChange(true)}
              size="lg"
              className="gap-2 shadow-brand"
            >
              <Plus className="h-4 w-4" />
              Добавить запись
            </Button>
          }
        />

        {isLoading ? (
          <EmployeeExitSkeleton />
        ) : isError ? (
          <ErrorState
            title="Не удалось загрузить выходы сотрудников"
            description="Повторите попытку. Если ошибка сохраняется, проверьте журнал приложения."
            onRetry={() => refetchExits()}
            retryLabel="Обновить данные"
          />
        ) : (
          <>
            <div className="surface-section space-y-4 mb-6">
              <SearchAndFilters
                searchPlaceholder="Поиск по ФИО, логину, номеру SD, дате или оборудованию... (Ctrl+F)"
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                searchInputRef={searchInputRef}
                filterOptions={[
                  { value: 'all', label: 'Все' },
                  { value: 'pending', label: 'Ожидают' },
                  { value: 'completed', label: 'Завершены' },
                ]}
                activeFilter={statusFilter}
                onFilterChange={setStatusFilter}
                actions={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={isExporting || meta.total === 0}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {isExporting ? 'Экспорт...' : 'Экспорт CSV'}
                  </Button>
                }
                summary={
                  <span className="status-pill status-pill--info text-xs">
                    {isFiltered ? (
                      <>
                        Найдено <span className="font-semibold text-foreground">{meta.total}</span>
                        {isFetching && (
                          <span className="ml-2 text-muted-foreground">(обновление...)</span>
                        )}
                      </>
                    ) : (
                      <>
                        Всего записей{' '}
                        <span className="font-semibold text-foreground">
                          {exitSummary?.totals.total ?? meta.total}
                        </span>
                      </>
                    )}
                  </span>
                }
                keyboardHints={[
                  { keys: ['Ctrl', 'F'], description: '— фокус на поиске' },
                  {
                    keys: ['Ctrl', 'Shift', 'F'],
                    description: '— переключить фильтр «Ожидают»',
                  },
                ]}
                quickHelp={{
                  visible: showQuickHelp,
                  title: 'Секундный onboarding для раздела',
                  items: [
                    'Ctrl+F — моментальный поиск по сотрудникам, логину, номеру SD и оборудованию.',
                    'Ctrl+Shift+F — переключение фильтра «Ожидают» для массового контроля выдач.',
                    'Кнопка «Экспорт CSV» сохранит текущий отфильтрованный список.',
                    'Иконка копирования в каждой записи — переносит список оборудования в буфер.',
                    'Поле «Номер SD» помогает связать запись с тикетом службы поддержки.',
                  ],
                  onDismiss: dismissQuickHelp,
                }}
              />
            </div>

            <EmployeeExitTable
              exits={exits}
              isFiltered={isFiltered}
              density={tableDensity}
              onEdit={handleEdit}
              highlightExitId={highlightExitId}
              onHighlightConsumed={onHighlightConsumed}
            />

            {meta.total > 0 && (
              <ListPagination
                page={meta.page}
                pageCount={meta.pageCount}
                pageSize={meta.pageSize}
                total={meta.total}
                pageSizeOptions={EXIT_PAGE_SIZE_OPTIONS}
                isFetching={isFetching}
                onPageChange={(nextPage: number) => setPage(nextPage)}
                onPageSizeChange={(nextSize: number) => {
                  setPageSize(nextSize)
                  setPage(1)
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Add Modal */}
      <AddEmployeeExitModal isOpen={isModalOpen} onClose={() => onModalOpenChange(false)} />

      {/* Edit Modal */}
      <EditEmployeeExitModal
        exit={selectedExit}
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
      />
    </div>
  )
}
