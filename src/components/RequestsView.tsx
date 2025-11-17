import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Plus } from 'lucide-react'
import type { Request } from '../types/ipc'
import { Button } from './ui/button'
import { useDebounce } from '../hooks/useDebounce'
import { RequestsTable } from './RequestsTable'
import { SearchAndFilters } from './SearchAndFilters'
import { usePersistentState } from '../hooks/usePersistentState'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'
import { useRequestSummaryQuery, useRequestsQuery } from '../hooks/useRequests'
import { ListPagination } from './ListPagination'

const REQUESTS_SEARCH_STORAGE_KEY = 'equipment-tracker:requests-search'
const REQUESTS_FILTER_STORAGE_KEY = 'equipment-tracker:requests-filter'
const REQUESTS_DENSITY_STORAGE_KEY = 'equipment-tracker:requests-density'
const REQUESTS_TIPS_STORAGE_KEY = 'equipment-tracker:requests-tips-dismissed'
const REQUESTS_PAGE_SIZE_STORAGE_KEY = 'equipment-tracker:requests-page-size'
const DEFAULT_PAGE_SIZE = 25
const PAGE_SIZE_OPTIONS = [25, 50, 100]

type RequestFilter = 'all' | 'issued' | 'not-issued' | 'return-pending' | 'return-completed'

type TableDensity = 'comfortable' | 'dense'

interface RequestsViewProps {
  onEdit: (request: Request) => void
  onAddRequest: () => void
  onScheduleReturn: (request: Request) => void
  highlightRequestId?: number | null
  highlightSearchQuery?: string | null
  onHighlightConsumed?: () => void
}

export function RequestsView({
  onEdit,
  onAddRequest,
  onScheduleReturn,
  highlightRequestId,
  highlightSearchQuery,
  onHighlightConsumed,
}: RequestsViewProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [page, setPage] = useState(1)

  const [searchQuery, setSearchQuery] = usePersistentState<string>(
    REQUESTS_SEARCH_STORAGE_KEY,
    '',
    {
      serializer: (value) => value,
      deserializer: (value) => value,
    }
  )
  const [statusFilter, setStatusFilter] = usePersistentState<RequestFilter>(
    REQUESTS_FILTER_STORAGE_KEY,
    'all',
    {
      serializer: (value) => value,
      deserializer: (value) =>
        value === 'issued' ||
        value === 'not-issued' ||
        value === 'all' ||
        value === 'return-pending' ||
        value === 'return-completed'
          ? (value as RequestFilter)
          : 'all',
    }
  )
  const [tableDensity, setTableDensity] = usePersistentState<TableDensity>(
    REQUESTS_DENSITY_STORAGE_KEY,
    'comfortable',
    {
      serializer: (value) => value,
      deserializer: (value) => (value === 'dense' ? 'dense' : 'comfortable'),
    }
  )
  const [showQuickHelp, setShowQuickHelp] = usePersistentState<boolean>(
    REQUESTS_TIPS_STORAGE_KEY,
    true,
    {
      serializer: (value) => (value ? 'visible' : 'hidden'),
      deserializer: (value) => value !== 'true' && value !== 'hidden' && value !== '0',
    }
  )
  const [pageSize, setPageSize] = usePersistentState<number>(
    REQUESTS_PAGE_SIZE_STORAGE_KEY,
    DEFAULT_PAGE_SIZE,
    {
      serializer: (value) => String(value),
      deserializer: (value) => {
        const parsed = Number(value)
        return Number.isFinite(parsed) && PAGE_SIZE_OPTIONS.includes(parsed)
          ? parsed
          : DEFAULT_PAGE_SIZE
      },
    }
  )
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const isFiltered = Boolean(debouncedSearchQuery.trim() || statusFilter !== 'all')

  const requestParams = useMemo(
    () => ({
      page,
      pageSize,
      search: debouncedSearchQuery.trim() ? debouncedSearchQuery.trim() : undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    [page, pageSize, debouncedSearchQuery, statusFilter]
  )

  const { data, isLoading, isError, isFetching, refetch } = useRequestsQuery(requestParams)
  const { data: requestSummary } = useRequestSummaryQuery()

  const requests = data?.items ?? []
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
    if (!highlightRequestId) {
      return
    }

    if (statusFilter !== 'all') {
      setStatusFilter('all')
    }

    if (searchQuery !== '') {
      setSearchQuery('')
    }
    setPage(1)
  }, [highlightRequestId, statusFilter, setStatusFilter, searchQuery, setSearchQuery])

  useEffect(() => {
    if (!highlightRequestId) {
      return
    }

    if (highlightSearchQuery !== undefined && highlightSearchQuery !== null) {
      setSearchQuery(highlightSearchQuery)
    }
  }, [highlightRequestId, highlightSearchQuery, setSearchQuery])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearchQuery, statusFilter, pageSize])

  useKeyboardShortcut(
    { key: 'f', ctrlKey: true, shiftKey: true },
    () => {
      setStatusFilter((current) => (current === 'not-issued' ? 'all' : 'not-issued'))
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

  const dismissQuickHelp = () => {
    setShowQuickHelp(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Заявки</h2>
          <p className="text-sm text-muted-foreground">
            Управление заявками на выдачу оборудования
          </p>
        </div>
        <Button onClick={onAddRequest} size="sm" className="shadow-brand px-4">
          <Plus className="mr-2 h-4 w-4" />
          Добавить заявку
        </Button>
      </div>

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
          <Button onClick={() => refetch()} variant="outline">
            Обновить данные
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            <SearchAndFilters
              searchPlaceholder="Поиск по ФИО, логину, номеру SD, оборудованию или серийному номеру... (Ctrl+F)"
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              searchInputRef={searchInputRef}
              filterOptions={[
                { value: 'all', label: 'Все' },
                { value: 'not-issued', label: 'Не выданные' },
                { value: 'issued', label: 'Выданные' },
                { value: 'return-pending', label: 'На сдачу' },
                { value: 'return-completed', label: 'Сданные' },
              ]}
              activeFilter={statusFilter}
              onFilterChange={setStatusFilter}
              density={tableDensity}
              onDensityChange={setTableDensity}
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
                      Всего заявок{' '}
                      <span className="font-semibold text-foreground">
                        {requestSummary?.totals.total ?? meta.total}
                      </span>
                    </>
                  )}
                </span>
              }
              keyboardHints={[
                { keys: ['Ctrl', 'F'], description: '— фокус на поиске' },
                {
                  keys: ['Ctrl', 'Shift', 'F'],
                  description: '— переключить фильтр «Не выданные»',
                },
              ]}
              quickHelp={{
                visible: showQuickHelp,
                title: 'Секундный onboarding для раздела',
                items: [
                  'Ctrl+N — моментальное создание новой заявки.',
                  'Ctrl+F — поиск по ФИО, логину, номеру SD, оборудованию и серийному номеру.',
                  'Отдельный фильтр «На сдачу» показывает заявки, где ждут возврата техники.',
                  'Кнопка редактирования и чекбокс статуса всегда под рукой.',
                ],
                onDismiss: dismissQuickHelp,
              }}
            />
          </div>

          <RequestsTable
            requests={requests}
            onEdit={onEdit}
            onScheduleReturn={onScheduleReturn}
            density={tableDensity}
            highlightRequestId={highlightRequestId}
            onHighlightConsumed={onHighlightConsumed}
            isFiltered={isFiltered}
          />

          {meta.total > 0 && (
            <ListPagination
              page={meta.page}
              pageCount={meta.pageCount}
              pageSize={meta.pageSize}
              total={meta.total}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
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
  )
}
