import { useMemo, useState } from 'react'
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
  BriefcaseBusiness,
  Package,
} from 'lucide-react'
import { useAuditLogsQuery } from '../hooks/useAuditLogs'
import type { AuditEntityType, AuditLogEntry } from '../types/ipc'
import { PageHeader } from './PageHeader'
import { EmptyState } from './EmptyState'
import { ListPagination } from './ListPagination'
import { usePersistentState } from '../hooks/usePersistentState'
import { cn } from '../lib/utils'

const PAGE_SIZE_OPTIONS = [25, 50, 100]
const DEFAULT_PAGE_SIZE = 50

const AUDIT_PAGE_SIZE_KEY = 'equipment-tracker:audit-page-size'
const AUDIT_ENTITY_FILTER_KEY = 'equipment-tracker:audit-entity-filter'

// ─── Метки действий ──────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  created: {
    label: 'Создано',
    color:
      'bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] border border-[hsl(var(--success)/0.3)]',
  },
  updated: {
    label: 'Обновлено',
    color:
      'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.25)]',
  },
  deleted: {
    label: 'Удалено',
    color:
      'bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))] border border-[hsl(var(--destructive)/0.25)]',
  },
  restored: {
    label: 'Восстановлено',
    color:
      'bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))] border border-[hsl(var(--warning)/0.25)]',
  },
  issued: {
    label: 'Выдано',
    color:
      'bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] border border-[hsl(var(--success)/0.3)]',
  },
  not_issued: {
    label: 'Не выдано',
    color:
      'bg-[hsl(var(--muted)/0.5)] text-muted-foreground border border-[hsl(var(--border)/0.5)]',
  },
  return_scheduled: {
    label: 'Возврат запланирован',
    color:
      'bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))] border border-[hsl(var(--warning)/0.25)]',
  },
  return_completed: {
    label: 'Возврат выполнен',
    color:
      'bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] border border-[hsl(var(--success)/0.3)]',
  },
  return_uncompleted: {
    label: 'Возврат отменён',
    color:
      'bg-[hsl(var(--muted)/0.5)] text-muted-foreground border border-[hsl(var(--border)/0.5)]',
  },
  return_cancelled: {
    label: 'Возврат отменён',
    color:
      'bg-[hsl(var(--muted)/0.5)] text-muted-foreground border border-[hsl(var(--border)/0.5)]',
  },
  item_status_changed: {
    label: 'Статус оборудования',
    color:
      'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.25)]',
  },
  completed: {
    label: 'Завершено',
    color:
      'bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] border border-[hsl(var(--success)/0.3)]',
  },
  uncompleted: {
    label: 'Снято завершение',
    color:
      'bg-[hsl(var(--muted)/0.5)] text-muted-foreground border border-[hsl(var(--border)/0.5)]',
  },
  equipment_status_changed: {
    label: 'Статус оборудования',
    color:
      'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.25)]',
  },
}

const ENTITY_LABELS: Record<AuditEntityType, string> = {
  request: 'Заявки',
  employee_exit: 'Увольнения',
}

// ─── Русские названия полей ──────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  // Общие
  id: 'ID',
  city: 'Город',
  status: 'Статус',
  // Заявки (requests)
  employee_name: 'ФИО сотрудника',
  login: 'Логин',
  sd_number: 'Номер SD',
  delivery_url: 'Ссылка на доставку',
  return_required: 'Требуется возврат',
  equipment: 'Оборудование',
  due_date: 'Дата возврата',
  issued: 'Выдано',
  return_date: 'Дата возврата',
  return_comment: 'Комментарий к возврату',
  // Увольнения (employee_exits)
  exit_date: 'Дата выхода',
  completed: 'Завершено',
  equipment_list: 'Список оборудования',
  // Оборудование (вложенные поля)
  item_id: 'ID позиции',
  item_name: 'Позиция оборудования',
  item_index: 'Индекс',
  equipment_items: 'Оборудование',
  old_status: 'Старый статус',
  new_status: 'Новый статус',
  // Значения статусов
  pending: 'Ожидает',
  in_progress: 'В работе',
  done: 'Выполнено',
  cancelled: 'Отменено',
  returned: 'Возвращено',
  not_returned: 'Не возвращено',
}

// ─── Вспомогательные компоненты ───────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const meta = ACTION_LABELS[action] ?? {
    label: action,
    color:
      'bg-[hsl(var(--muted)/0.5)] text-muted-foreground border border-[hsl(var(--border)/0.5)]',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        meta.color
      )}
    >
      {meta.label}
    </span>
  )
}

function EntityBadge({ type }: { type: AuditEntityType }) {
  if (type === 'request') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Package className="h-3.5 w-3.5" />
        Заявка
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <BriefcaseBusiness className="h-3.5 w-3.5" />
      Увольнение
    </span>
  )
}

function ChangesCell({ changes }: { changes: string }) {
  const parsed = useMemo(() => {
    try {
      const obj = JSON.parse(changes) as Record<string, unknown>
      if (obj && typeof obj === 'object' && Object.keys(obj).length > 0) return obj
      return null
    } catch {
      return null
    }
  }, [changes])

  if (!parsed) return <span className="text-xs text-muted-foreground/40 select-none">—</span>

  const count = Object.keys(parsed).length
  return (
    <span className="text-xs text-muted-foreground">
      {count} {count === 1 ? 'поле' : count < 5 ? 'поля' : 'полей'}
    </span>
  )
}

// ─── Статусы оборудования ────────────────────────────────────────────────────

const ITEM_STATUS_LABELS: Record<string, string> = {
  ordered: 'Заказано',
  in_transit: 'В пути',
  in_stock: 'На складе',
  issued: 'Выдано',
  pending: 'Ожидает',
  collected: 'Собрано',
  missing: 'Отсутствует',
}

// ─── Форматирование значения ──────────────────────────────────────────────────

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'да' : 'нет'
  if (typeof value === 'string' && value === '') return '(пусто)'
  if (Array.isArray(value)) return `${value.length} поз.`
  return String(value)
}

function isItemsArray(value: unknown): value is Array<Record<string, unknown>> {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === 'object' &&
    value[0] !== null &&
    'name' in value[0]
  )
}

function formatItem(item: Record<string, unknown>): string {
  const parts: string[] = []
  if (item.name) parts.push(String(item.name))
  if (item.qty && Number(item.qty) !== 1) parts.push(`× ${item.qty}`)
  if (item.serial) parts.push(`SN: ${item.serial}`)
  if (item.status) parts.push(ITEM_STATUS_LABELS[String(item.status)] ?? String(item.status))
  return parts.join(' · ') || '—'
}

// ─── Карточка изменений ───────────────────────────────────────────────────────

type DiffEntry =
  | { kind: 'diff'; field: string; old: unknown; new: unknown }
  | { kind: 'plain'; field: string; value: unknown }

function ChangesDiffCard({ changes, action }: { changes: string; action: string }) {
  const entries = useMemo((): DiffEntry[] => {
    try {
      const obj = JSON.parse(changes) as Record<string, unknown>
      if (!obj || typeof obj !== 'object') return []
      return Object.entries(obj).map(([field, value]) => {
        if (
          value !== null &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          'old' in (value as object) &&
          'new' in (value as object)
        ) {
          const v = value as { old: unknown; new: unknown }
          return { kind: 'diff', field, old: v.old, new: v.new }
        }
        return { kind: 'plain', field, value }
      })
    } catch {
      return []
    }
  }, [changes])

  if (entries.length === 0) {
    return (
      <div className="px-6 py-3 text-xs text-muted-foreground/60 italic">
        Подробности недоступны
      </div>
    )
  }

  const isDiff =
    action === 'updated' ||
    action === 'item_status_changed' ||
    action === 'equipment_status_changed'

  return (
    <div className="px-4 pb-4 pt-1">
      <div className="rounded-xl border border-border/70 bg-muted/20 overflow-hidden divide-y divide-border/40 shadow-sm">
        {/* Заголовок */}
        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/30 flex gap-4">
          <span className="w-44 shrink-0">Поле</span>
          {isDiff ? (
            <>
              <span className="text-[hsl(var(--destructive)/0.7)]">Было</span>
              <span className="ml-auto text-[hsl(var(--success))]">Стало</span>
            </>
          ) : (
            <span>Значение</span>
          )}
        </div>

        {entries.map((e) => (
          <div
            key={e.field}
            className="flex items-start gap-4 px-4 py-2.5 hover:bg-muted/30 transition-colors"
          >
            {/* Название поля */}
            <span className="w-44 shrink-0 text-xs text-muted-foreground font-medium pt-0.5">
              {FIELD_LABELS[e.field] ?? e.field}
            </span>

            {e.kind === 'diff' ? (
              /* Diff */
              isItemsArray(e.old) || isItemsArray(e.new) ? (
                /* Diff оборудования: два столбца */
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="flex-1 space-y-0.5 min-w-0">
                    {isItemsArray(e.old) ? (
                      e.old.map((item, i) => (
                        <div
                          key={i}
                          className="text-xs line-through text-[hsl(var(--destructive)/0.7)] truncate"
                        >
                          {formatItem(item)}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground/40 italic">(не было)</span>
                    )}
                  </div>
                  <svg
                    className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground/50"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex-1 space-y-0.5 min-w-0">
                    {isItemsArray(e.new) ? (
                      e.new.map((item, i) => (
                        <div
                          key={i}
                          className="text-xs font-medium text-[hsl(var(--success))] truncate"
                        >
                          {formatItem(item)}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground/40 italic">(пусто)</span>
                    )}
                  </div>
                </div>
              ) : (
                /* Inline diff: зачёркнуто → стрелка → новое */
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
                  {formatValue(e.old) !== '—' ? (
                    <span className="line-through text-xs text-[hsl(var(--destructive)/0.75)] break-all">
                      {formatValue(e.old)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/40 italic">(не было)</span>
                  )}
                  <svg
                    className="h-3 w-3 shrink-0 text-muted-foreground/50"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-xs font-medium text-[hsl(var(--success))] break-all">
                    {formatValue(e.new)}
                  </span>
                </div>
              )
            ) : /* Plain */
            isItemsArray(e.value) ? (
              /* Список оборудования */
              <ul className="space-y-0.5 min-w-0">
                {e.value.map((item, i) => (
                  <li key={i} className="text-xs text-foreground">
                    <span className="text-muted-foreground mr-1">{i + 1}.</span>
                    {formatItem(item)}
                  </li>
                ))}
              </ul>
            ) : (
              /* Обычное значение */
              <span className="text-xs text-foreground break-all">{formatValue(e.value)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function formatDateTime(isoString: string): { date: string; time: string } {
  try {
    const d = new Date(isoString)
    const date = d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const time = d.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    return { date, time }
  } catch {
    return { date: isoString, time: '' }
  }
}

function AuditTableSkeleton() {
  return (
    <div className="rounded-lg border bg-card overflow-hidden animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/60">
            <tr>
              {['#', 'Дата / время', 'Сущность', 'Действие', 'Автор', 'Изменения'].map((h) => (
                <th key={h} className="px-4 py-3 text-left">
                  <div className="h-4 bg-muted rounded w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-t border-border/50">
                <td className="px-4 py-3">
                  <div className="h-4 bg-muted rounded w-10" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-muted rounded w-32" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-muted rounded w-24" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-5 bg-muted rounded-full w-28" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-muted rounded w-20" />
                </td>
                <td className="px-4 py-3">
                  <div className="h-4 bg-muted rounded w-16" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AuditRow({ entry }: { entry: AuditLogEntry }) {
  const [expanded, setExpanded] = useState(false)
  const { date, time } = formatDateTime(entry.created_at)

  const hasChanges = useMemo(() => {
    try {
      const obj = JSON.parse(entry.changes)
      return obj && typeof obj === 'object' && Object.keys(obj).length > 0
    } catch {
      return false
    }
  }, [entry.changes])

  return (
    <>
      <tr
        className={cn(
          'border-t border-border/50 transition-colors',
          hasChanges ? 'cursor-pointer hover:bg-muted/25 active:bg-muted/40' : 'hover:bg-muted/15',
          expanded && 'bg-muted/20'
        )}
        onClick={() => hasChanges && setExpanded((p) => !p)}
      >
        {/* ID */}
        <td className="px-4 py-3 text-xs text-muted-foreground font-mono">#{entry.entity_id}</td>

        {/* Дата + время */}
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="text-sm text-foreground">{date}</div>
          <div className="text-xs text-muted-foreground">{time}</div>
        </td>

        {/* Сущность */}
        <td className="px-4 py-3">
          <EntityBadge type={entry.entity_type} />
        </td>

        {/* Действие */}
        <td className="px-4 py-3">
          <ActionBadge action={entry.action} />
        </td>

        {/* Автор */}
        <td className="px-4 py-3 text-sm text-muted-foreground max-w-[180px] truncate">
          <span title={entry.actor_id}>
            {entry.actor_login || (entry.actor_id ? entry.actor_id.slice(0, 8) + '...' : '—')}
          </span>
        </td>

        {/* Изменения — сводка + иконка раскрытия */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <ChangesCell changes={entry.changes} />
            {hasChanges &&
              (expanded ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              ))}
          </div>
        </td>
      </tr>

      {/* Карточка изменений */}
      {expanded && (
        <tr className="bg-muted/10 border-t border-border/30">
          <td colSpan={6} className="p-0">
            <ChangesDiffCard changes={entry.changes} action={entry.action} />
          </td>
        </tr>
      )}
    </>
  )
}

// ─── Основной компонент ───────────────────────────────────────────────────────

type EntityFilter = '' | 'request' | 'employee_exit'

export function AuditLogView() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = usePersistentState<number>(
    AUDIT_PAGE_SIZE_KEY,
    DEFAULT_PAGE_SIZE,
    {
      serializer: (v) => String(v),
      deserializer: (v) => {
        const n = Number(v)
        return PAGE_SIZE_OPTIONS.includes(n) ? n : DEFAULT_PAGE_SIZE
      },
    }
  )
  const [entityFilter, setEntityFilter] = usePersistentState<EntityFilter>(
    AUDIT_ENTITY_FILTER_KEY,
    '',
    {
      serializer: (v) => v,
      deserializer: (v) => (v === 'request' || v === 'employee_exit' ? v : ''),
    }
  )

  const params = useMemo(
    () => ({
      page,
      pageSize,
      entity_type: entityFilter as AuditEntityType | '',
    }),
    [page, pageSize, entityFilter]
  )

  const { data, isLoading, isFetching, isError } = useAuditLogsQuery(params)

  const handleEntityFilterChange = (value: EntityFilter) => {
    setEntityFilter(value)
    setPage(1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Заголовок */}
      <PageHeader
        eyebrow="Мониторинг"
        title="Аудит-лог"
        description="История действий с заявками и увольнениями сотрудников. Данные изолированы по городу."
      />

      {/* Фильтры */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Сущность:</span>
        </div>
        {(
          [
            { value: '', label: 'Все' },
            { value: 'request', label: 'Заявки' },
            { value: 'employee_exit', label: 'Увольнения' },
          ] as { value: EntityFilter; label: string }[]
        ).map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleEntityFilterChange(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
              entityFilter === opt.value
                ? 'bg-gradient-primary text-primary-foreground border-transparent shadow-brand'
                : 'bg-card border-border text-muted-foreground hover:bg-muted/40'
            )}
          >
            {opt.label}
          </button>
        ))}

        {isFetching && !isLoading && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Обновление…
          </span>
        )}

        {data && (
          <span className="ml-auto text-sm text-muted-foreground">
            Всего: <span className="font-medium text-foreground">{data.meta.total}</span>
          </span>
        )}
      </div>

      {/* Таблица */}
      {isLoading ? (
        <AuditTableSkeleton />
      ) : isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-sm text-destructive">
            Ошибка загрузки аудит-лога. Попробуйте обновить страницу.
          </p>
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Нет записей"
          description={
            entityFilter
              ? `Для выбранного типа «${ENTITY_LABELS[entityFilter as AuditEntityType]}» записей пока нет.`
              : 'История действий пуста. Записи появятся после создания или изменения заявок и увольнений.'
          }
        />
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">Дата / время</th>
                  <th className="px-4 py-3 text-left font-medium">Тип</th>
                  <th className="px-4 py-3 text-left font-medium">Действие</th>
                  <th className="px-4 py-3 text-left font-medium">Автор</th>
                  <th className="px-4 py-3 text-left font-medium">Изменения</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((entry) => (
                  <AuditRow key={entry.id} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Пагинация */}
      {data && data.meta.pageCount > 1 && (
        <ListPagination
          page={page}
          pageCount={data.meta.pageCount}
          total={data.meta.total}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          isFetching={isFetching}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  )
}
