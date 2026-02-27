import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, History, RefreshCw } from 'lucide-react'
import { useAuditLogsQuery } from '../hooks/useAuditLogs'
import type { AuditEntityType, AuditLogEntry } from '../types/ipc'
import { cn } from '../lib/utils'

// ─── Метки действий ───────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, { label: string; color: string; dot: string }> = {
  created: {
    label: 'Создано',
    color:
      'bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] border border-[hsl(var(--success)/0.3)]',
    dot: 'bg-[hsl(var(--success))]',
  },
  updated: {
    label: 'Обновлено',
    color:
      'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.25)]',
    dot: 'bg-[hsl(var(--primary))]',
  },
  deleted: {
    label: 'Удалено',
    color:
      'bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))] border border-[hsl(var(--destructive)/0.25)]',
    dot: 'bg-[hsl(var(--destructive))]',
  },
  restored: {
    label: 'Восстановлено',
    color:
      'bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))] border border-[hsl(var(--warning)/0.25)]',
    dot: 'bg-[hsl(var(--warning))]',
  },
  issued: {
    label: 'Выдано',
    color:
      'bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] border border-[hsl(var(--success)/0.3)]',
    dot: 'bg-[hsl(var(--success))]',
  },
  not_issued: {
    label: 'Не выдано',
    color:
      'bg-[hsl(var(--muted)/0.5)] text-muted-foreground border border-[hsl(var(--border)/0.5)]',
    dot: 'bg-muted-foreground',
  },
  return_scheduled: {
    label: 'Возврат запланирован',
    color:
      'bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))] border border-[hsl(var(--warning)/0.25)]',
    dot: 'bg-[hsl(var(--warning))]',
  },
  return_completed: {
    label: 'Возврат выполнен',
    color:
      'bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] border border-[hsl(var(--success)/0.3)]',
    dot: 'bg-[hsl(var(--success))]',
  },
  return_uncompleted: {
    label: 'Возврат отменён',
    color:
      'bg-[hsl(var(--muted)/0.5)] text-muted-foreground border border-[hsl(var(--border)/0.5)]',
    dot: 'bg-muted-foreground',
  },
  return_cancelled: {
    label: 'Возврат отменён',
    color:
      'bg-[hsl(var(--muted)/0.5)] text-muted-foreground border border-[hsl(var(--border)/0.5)]',
    dot: 'bg-muted-foreground',
  },
  item_status_changed: {
    label: 'Статус оборудования',
    color:
      'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.25)]',
    dot: 'bg-[hsl(var(--primary))]',
  },
  completed: {
    label: 'Завершено',
    color:
      'bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] border border-[hsl(var(--success)/0.3)]',
    dot: 'bg-[hsl(var(--success))]',
  },
  uncompleted: {
    label: 'Снято завершение',
    color:
      'bg-[hsl(var(--muted)/0.5)] text-muted-foreground border border-[hsl(var(--border)/0.5)]',
    dot: 'bg-muted-foreground',
  },
  equipment_status_changed: {
    label: 'Статус оборудования',
    color:
      'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.25)]',
    dot: 'bg-[hsl(var(--primary))]',
  },
}

// ─── Русские названия полей ────────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  id: 'ID',
  city: 'Город',
  status: 'Статус',
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
  exit_date: 'Дата выхода',
  completed: 'Завершено',
  equipment_list: 'Список оборудования',
  item_id: 'ID позиции',
  item_name: 'Позиция оборудования',
  item_index: 'Индекс',
  equipment_items: 'Оборудование',
  old_status: 'Старый статус',
  new_status: 'Новый статус',
  notes: 'Заметки',
  pending: 'Ожидает',
  in_progress: 'В работе',
  done: 'Выполнено',
  cancelled: 'Отменено',
  returned: 'Возвращено',
  not_returned: 'Не возвращено',
}

// ─── Статусы оборудования ─────────────────────────────────────────────────────

const ITEM_STATUS_LABELS: Record<string, string> = {
  ordered: 'Заказано',
  in_transit: 'В пути',
  in_stock: 'На складе',
  issued: 'Выдано',
  pending: 'Ожидает',
  collected: 'Собрано',
  missing: 'Отсутствует',
}

// ─── Вспомогательные функции ──────────────────────────────────────────────────

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
      <div className="px-3 py-2 text-xs text-muted-foreground/60 italic">
        Подробности недоступны
      </div>
    )
  }

  const isDiff =
    action === 'updated' ||
    action === 'item_status_changed' ||
    action === 'equipment_status_changed'

  return (
    <div className="mt-2 rounded-lg border border-border/60 bg-muted/20 overflow-hidden divide-y divide-border/40">
      {/* Заголовок */}
      <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-muted/30 flex gap-3">
        <span className="w-36 shrink-0">Поле</span>
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
          className="flex items-start gap-3 px-3 py-2 hover:bg-muted/20 transition-colors"
        >
          {/* Название поля */}
          <span className="w-36 shrink-0 text-xs text-muted-foreground font-medium pt-0.5">
            {FIELD_LABELS[e.field] ?? e.field}
          </span>

          {e.kind === 'diff' ? (
            isItemsArray(e.old) || isItemsArray(e.new) ? (
              /* Diff оборудования: два столбца */
              <div className="flex items-start gap-3 min-w-0 flex-1">
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
                  className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground/50"
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
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
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
          ) : isItemsArray(e.value) ? (
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
  )
}

// ─── Элемент тайм-лайна ───────────────────────────────────────────────────────

function TimelineEntry({ entry, isLast }: { entry: AuditLogEntry; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const { date, time } = formatDateTime(entry.created_at)

  const meta = ACTION_LABELS[entry.action] ?? {
    label: entry.action,
    color:
      'bg-[hsl(var(--muted)/0.5)] text-muted-foreground border border-[hsl(var(--border)/0.5)]',
    dot: 'bg-muted-foreground',
  }

  const hasChanges = useMemo(() => {
    try {
      const obj = JSON.parse(entry.changes)
      return obj && typeof obj === 'object' && Object.keys(obj).length > 0
    } catch {
      return false
    }
  }, [entry.changes])

  return (
    <div className="flex gap-3">
      {/* Левый тайм-лайн: точка + линия */}
      <div className="flex flex-col items-center">
        <div
          className={cn('mt-1 h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-background', meta.dot)}
        />
        {!isLast && <div className="mt-1 w-px flex-1 bg-border/50" />}
      </div>

      {/* Правая часть */}
      <div className={cn('flex-1 min-w-0', !isLast && 'pb-4')}>
        {/* Строка: бейдж + время + автор + кнопка */}
        <div
          className={cn(
            'flex flex-wrap items-center gap-2',
            hasChanges && 'cursor-pointer select-none'
          )}
          onClick={() => hasChanges && setExpanded((p) => !p)}
        >
          {/* Бейдж действия */}
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0',
              meta.color
            )}
          >
            {meta.label}
          </span>

          {/* Дата + время */}
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {date} <span className="text-muted-foreground/60">{time}</span>
          </span>

          {/* Автор */}
          {entry.actor_login && (
            <span
              className="text-xs text-muted-foreground/70 truncate max-w-[140px]"
              title={entry.actor_login}
            >
              · {entry.actor_login}
            </span>
          )}

          {/* Иконка раскрытия */}
          {hasChanges && (
            <span className="ml-auto shrink-0 text-muted-foreground/50">
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </span>
          )}
        </div>

        {/* Карточка деталей (раскрывается) */}
        {expanded && hasChanges && (
          <ChangesDiffCard changes={entry.changes} action={entry.action} />
        )}
      </div>
    </div>
  )
}

// ─── Скелетон загрузки ────────────────────────────────────────────────────────

function HistorySkeleton() {
  return (
    <div className="space-y-4 animate-pulse px-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="mt-1 h-2.5 w-2.5 rounded-full bg-muted" />
            {i < 4 && <div className="mt-1 w-px h-10 bg-border/50" />}
          </div>
          <div className="flex-1 pb-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-5 w-20 rounded-full bg-muted" />
              <div className="h-3 w-28 rounded bg-muted" />
              <div className="h-3 w-16 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Основной компонент ───────────────────────────────────────────────────────

interface AuditHistoryPanelProps {
  entityType: AuditEntityType
  entityId: number
  className?: string
}

export function AuditHistoryPanel({ entityType, entityId, className }: AuditHistoryPanelProps) {
  const params = useMemo(
    () => ({
      page: 1,
      pageSize: 100,
      entity_type: entityType,
      entity_id: entityId,
    }),
    [entityType, entityId]
  )

  const { data, isLoading, isFetching, isError, refetch } = useAuditLogsQuery(params)

  if (isLoading) {
    return (
      <div className={cn('py-4', className)}>
        <HistorySkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className={cn('py-6 flex flex-col items-center gap-3', className)}>
        <p className="text-sm text-destructive text-center">
          Ошибка загрузки истории. Попробуйте ещё раз.
        </p>
        <button
          onClick={() => refetch()}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          Повторить
        </button>
      </div>
    )
  }

  const items = data?.items ?? []

  return (
    <div className={cn('space-y-0', className)}>
      {/* Заголовок секции */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <History className="h-4 w-4 text-muted-foreground" />
          <span>История изменений</span>
          {items.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">({items.length})</span>
          )}
        </div>
        {isFetching && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground/60" />}
      </div>

      {items.length === 0 ? (
        <div className="py-8 flex flex-col items-center gap-2">
          <History className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground text-center">История действий пуста</p>
        </div>
      ) : (
        <div className="space-y-0">
          {items.map((entry, index) => (
            <TimelineEntry key={entry.id} entry={entry} isLast={index === items.length - 1} />
          ))}
        </div>
      )}
    </div>
  )
}
