import { AlertTriangle, Download, Plus } from 'lucide-react'
import { EmployeeExitTable } from './EmployeeExitTable'
import { AddEmployeeExitModal } from './AddEmployeeExitModal'
import { EditEmployeeExitModal } from './EditEmployeeExitModal'
import { useEmployeeExitsQuery } from '../hooks/useEmployeeExits'
import { Button } from './ui/button'
import { useMemo, useRef, useState } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { toast } from 'sonner'
import { SearchAndFilters } from './SearchAndFilters'
import { usePersistentState } from '../hooks/usePersistentState'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'
import type { EmployeeExit } from '../types/ipc'
import { parseExitEquipmentList } from '../lib/employeeExitEquipment'

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
  const [tableDensity, setTableDensity] = usePersistentState<'comfortable' | 'dense'>(
    EXIT_DENSITY_STORAGE_KEY,
    'comfortable',
    {
      serializer: (value) => value,
      deserializer: (value) => (value === 'dense' ? 'dense' : 'comfortable'),
    }
  )
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

        const equipmentItems = parseExitEquipmentList(exit.equipment_list)

        return (
          exit.employee_name.toLowerCase().includes(query) ||
          exit.login.toLowerCase().includes(query) ||
          (exit.sd_number && exit.sd_number.toLowerCase().includes(query)) ||
          formattedDate.toLowerCase().includes(query) ||
          equipmentItems.some(
            (item) =>
              item.name.toLowerCase().includes(query) || item.serial.toLowerCase().includes(query)
          )
        )
      })
    }

    return list.sort((a, b) => new Date(a.exit_date).getTime() - new Date(b.exit_date).getTime())
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
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">Список выходов</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Управление записями о выходе сотрудников
            </p>
          </div>
          <Button onClick={() => onModalOpenChange(true)} size="sm" className="shadow-brand px-4">
            <Plus className="mr-2 h-4 w-4" />
            Добавить запись
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
                density={tableDensity}
                onDensityChange={setTableDensity}
                actions={
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
                }
                summary={
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
              exits={filteredExits}
              isFiltered={Boolean(searchQuery || statusFilter !== 'all')}
              density={tableDensity}
              onEdit={handleEdit}
            />
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
