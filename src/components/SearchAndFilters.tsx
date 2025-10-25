import { Search } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'

interface SearchAndFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filter: 'all' | 'issued' | 'not-issued'
  onFilterChange: (filter: 'all' | 'issued' | 'not-issued') => void
  totalCount: number
  filteredCount: number
  searchInputRef?: React.RefObject<HTMLInputElement>
}

export function SearchAndFilters({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  totalCount,
  filteredCount,
  searchInputRef,
}: SearchAndFiltersProps) {
  return (
    <div className="space-y-4 mb-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Поиск по ФИО, оборудованию или серийному номеру..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters and Counter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('all')}
          >
            Все
          </Button>
          <Button
            variant={filter === 'issued' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('issued')}
          >
            Выданные
          </Button>
          <Button
            variant={filter === 'not-issued' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('not-issued')}
          >
            Не выданные
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {searchQuery || filter !== 'all' ? (
            <span>
              Найдено: <span className="font-semibold text-foreground">{filteredCount}</span> из{' '}
              {totalCount}
            </span>
          ) : (
            <span>
              Всего заявок: <span className="font-semibold text-foreground">{totalCount}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
