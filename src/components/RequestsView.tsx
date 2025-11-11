import { useMemo, useRef } from 'react'
import { AlertTriangle, Plus } from 'lucide-react'
import type { Request } from '../types/ipc'
import { Button } from './ui/button'
import { useDebounce } from '../hooks/useDebounce'
import { RequestsTable } from './RequestsTable'
import { SearchAndFilters } from './SearchAndFilters'
import { usePersistentState } from '../hooks/usePersistentState'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'

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
  onAddRequest: () => void
}

export function RequestsView({
  requests,
  isLoading,
  isError,
  onRetry,
  onEdit,
  onAddRequest,
}: RequestsViewProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)

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
        value === 'issued' || value === 'not-issued' || value === 'all'
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
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

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

        if (request.login.toLowerCase().includes(query)) {
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
          <Button onClick={onRetry} variant="outline">
            Обновить данные
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            <SearchAndFilters
              searchPlaceholder="Поиск по ФИО, логину, оборудованию или серийному номеру... (Ctrl+F)"
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              searchInputRef={searchInputRef}
              filterOptions={[
                { value: 'all', label: 'Все' },
                { value: 'not-issued', label: 'Не выданные' },
                { value: 'issued', label: 'Выданные' },
              ]}
              activeFilter={statusFilter}
              onFilterChange={setStatusFilter}
              density={tableDensity}
              onDensityChange={setTableDensity}
              summary={
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
                  'Ctrl+F — поиск по ФИО, логину, оборудованию и серийному номеру.',
                  'Фильтр «Не выданные» помогает отслеживать ожидающие заявки.',
                  'Кнопка редактирования и чекбокс статуса всегда под рукой.',
                ],
                onDismiss: dismissQuickHelp,
              }}
            />
          </div>

          <RequestsTable requests={filteredRequests} onEdit={onEdit} density={tableDensity} />
        </>
      )}
    </div>
  )
}
