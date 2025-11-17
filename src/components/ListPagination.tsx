import { ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react'
import { cn } from '../lib/utils'
import { Button } from './ui/button'

interface ListPaginationProps {
  page: number
  pageCount: number
  total: number
  pageSize: number
  pageSizeOptions?: number[]
  isFetching?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

export function ListPagination({
  page,
  pageCount,
  total,
  pageSize,
  pageSizeOptions = [25, 50, 100],
  isFetching = false,
  onPageChange,
  onPageSizeChange,
}: ListPaginationProps) {
  const canGoBack = page > 1
  const canGoForward = page < pageCount

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-muted/10 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <span className="text-foreground font-medium">
          Страница {page} из {Math.max(pageCount, 1)}
        </span>
        <span>
          Показано {pageSize} из {total} записей
          {isFetching && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <RefreshCcw className="h-3 w-3 animate-spin" /> Обновление...
            </span>
          )}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {onPageSizeChange && pageSizeOptions.length > 0 && (
          <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            На странице
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-md border border-border/60 bg-background px-2 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canGoBack}
            onClick={() => canGoBack && onPageChange(page - 1)}
            className={cn('min-w-[6rem]', !canGoBack && 'opacity-60')}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Назад
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canGoForward}
            onClick={() => canGoForward && onPageChange(page + 1)}
            className={cn('min-w-[6rem]', !canGoForward && 'opacity-60')}
          >
            Вперёд
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
