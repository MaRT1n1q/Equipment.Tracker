import type { ReactNode, RefObject } from 'react'
import { Info, Search, X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { cn } from '../lib/utils'

type DensityOption = 'comfortable' | 'dense'

interface FilterOption<T extends string> {
  value: T
  label: string
}

interface KeyboardHint {
  keys: string[]
  description: string
}

interface QuickHelpConfig {
  visible: boolean
  title: string
  description?: string
  items: string[]
  onDismiss: () => void
}

interface SearchAndFiltersProps<TFilter extends string = string> {
  searchPlaceholder: string
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  searchInputRef?: RefObject<HTMLInputElement | null>
  filterOptions: FilterOption<TFilter>[]
  activeFilter: TFilter
  onFilterChange: (value: TFilter) => void
  density?: DensityOption
  onDensityChange?: (value: DensityOption) => void
  densityLabels?: {
    comfortable: string
    dense: string
  }
  summary?: ReactNode
  actions?: ReactNode
  keyboardHints?: KeyboardHint[]
  quickHelp?: QuickHelpConfig
  className?: string
}

const defaultDensityLabels = {
  comfortable: 'Обычный',
  dense: 'Компактный',
}

export function SearchAndFilters<TFilter extends string = string>({
  searchPlaceholder,
  searchQuery,
  onSearchQueryChange,
  searchInputRef,
  filterOptions,
  activeFilter,
  onFilterChange,
  density = 'dense',
  onDensityChange,
  densityLabels = defaultDensityLabels,
  summary,
  actions,
  keyboardHints,
  quickHelp,
  className,
}: SearchAndFiltersProps<TFilter>) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="pl-10"
        />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={activeFilter === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-end">
          {actions}
          {summary}
          {onDensityChange ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Отображение</span>
              <div className="inline-flex rounded-full border border-border bg-background/80 p-0.5">
                <Button
                  size="sm"
                  variant={density === 'comfortable' ? 'default' : 'ghost'}
                  className={cn(
                    'h-7 rounded-full px-3 text-xs',
                    density === 'comfortable' ? '' : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => onDensityChange('comfortable')}
                >
                  {densityLabels.comfortable}
                </Button>
                <Button
                  size="sm"
                  variant={density === 'dense' ? 'default' : 'ghost'}
                  className={cn(
                    'h-7 rounded-full px-3 text-xs',
                    density === 'dense' ? '' : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => onDensityChange('dense')}
                >
                  {densityLabels.dense}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {keyboardHints && keyboardHints.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {keyboardHints.map((hint) => (
            <span className="flex items-center gap-1" key={hint.description}>
              {hint.keys.map((key, index) => (
                <span className="flex items-center" key={`${hint.description}-${key}-${index}`}>
                  <kbd className="px-1.5 py-0.5 rounded border bg-muted">{key}</kbd>
                  {index < hint.keys.length - 1 && <span className="px-0.5">+</span>}
                </span>
              ))}
              <span>{hint.description}</span>
            </span>
          ))}
        </div>
      )}

      {quickHelp?.visible && (
        <div className="mt-4 flex flex-wrap items-start gap-3 rounded-lg border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] px-4 py-3 text-sm">
          <Info className="mt-0.5 h-5 w-5 text-[hsl(var(--primary))]" />
          <div className="flex-1 space-y-1 text-muted-foreground">
            <p className="font-medium text-foreground">{quickHelp.title}</p>
            {quickHelp.description && <p>{quickHelp.description}</p>}
            <ul className="list-disc space-y-1 pl-5">
              {quickHelp.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={quickHelp.onDismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
