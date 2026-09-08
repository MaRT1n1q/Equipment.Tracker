import { useMemo } from 'react'
import {
  Calendar,
  Package,
  PackageCheck,
  Clock,
  BriefcaseBusiness,
  TrendingUp,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react'
import { useAnalyticsQuery } from '../hooks/useAnalytics'
import { usePersistentState } from '../hooks/usePersistentState'
import { PageHeader } from './PageHeader'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { cn } from '../lib/utils'

const FROM_STORAGE_KEY = 'equipment-tracker:analytics-from'
const TO_STORAGE_KEY = 'equipment-tracker:analytics-to'

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function defaultFrom(): string {
  const now = new Date()
  now.setDate(1) // начало текущего месяца
  return toISODate(now)
}

function defaultTo(): string {
  return toISODate(new Date())
}

// Пресеты периодов для быстрого выбора.
const PRESETS: { label: string; days: number }[] = [
  { label: '7 дней', days: 7 },
  { label: '30 дней', days: 30 },
  { label: '90 дней', days: 90 },
  { label: 'Год', days: 365 },
]

interface StatCard {
  title: string
  value: number
  icon: typeof Package
  accent: 'info' | 'success' | 'warning' | 'danger'
}

const accentStyles = {
  info: {
    icon: 'status-icon status-icon--info',
    underline: 'bg-[hsl(var(--primary))]',
  },
  success: {
    icon: 'status-icon status-icon--success',
    underline: 'bg-[hsl(var(--success))]',
  },
  warning: {
    icon: 'status-icon status-icon--warning',
    underline: 'bg-[hsl(var(--warning))]',
  },
  danger: {
    icon: 'status-icon status-icon--danger',
    underline: 'bg-[hsl(var(--destructive))]',
  },
}

function StatCardView({ card, index }: { card: StatCard; index: number }) {
  const accent = accentStyles[card.accent]
  return (
    <div
      className="group relative surface-card surface-card-hover overflow-hidden animate-scale-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className={`${accent.icon} transition-transform duration-300 group-hover:scale-105`}>
            <card.icon className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-foreground">{card.value}</div>
        </div>
        <div className="text-sm font-medium text-muted-foreground">{card.title}</div>
      </div>
      <div className={`absolute inset-x-0 bottom-0 h-1 ${accent.underline}`} />
    </div>
  )
}

// Простой bar-график на чистом CSS (без внешних зависимостей).
function TrendChart({
  title,
  icon: Icon,
  data,
}: {
  title: string
  icon: typeof Package
  data: { day: string; count: number }[]
}) {
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div className="surface-section space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="surface-section__title">Динамика по дням</p>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <Icon className="h-5 w-5 text-[hsl(var(--primary))]" />
            {title}
          </h2>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Нет данных за выбранный период.</p>
      ) : (
        <div className="flex items-end gap-1 overflow-x-auto pb-2" style={{ minHeight: '180px' }}>
          {data.map((point) => {
            const height =
              point.count === 0 ? 2 : Math.max(8, Math.round((point.count / max) * 140))
            const label = point.day.slice(5) // MM-DD
            return (
              <div
                key={point.day}
                className="flex flex-col items-center justify-end gap-1 group min-w-[28px] flex-1"
                title={`${point.day}: ${point.count}`}
              >
                <span className="text-[10px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {point.count}
                </span>
                <div
                  className="w-full max-w-[24px] rounded-t-md bg-[hsl(var(--primary))]/70 transition-all duration-300 group-hover:bg-[hsl(var(--primary))]"
                  style={{ height: `${height}px` }}
                />
                <span className="text-[9px] text-muted-foreground whitespace-nowrap">{label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function AnalyticsView() {
  const [from, setFrom] = usePersistentState<string>(FROM_STORAGE_KEY, defaultFrom(), {
    serializer: (v) => v,
    deserializer: (v) => v,
  })
  const [to, setTo] = usePersistentState<string>(TO_STORAGE_KEY, defaultTo(), {
    serializer: (v) => v,
    deserializer: (v) => v,
  })

  const params = useMemo(
    () => ({
      from: from || undefined,
      to: to || undefined,
    }),
    [from, to]
  )

  const { data, isLoading, isError, refetch } = useAnalyticsQuery(params)

  const requestCards: StatCard[] = [
    { title: 'Всего заявок', value: data?.requests.total ?? 0, icon: Package, accent: 'info' },
    { title: 'Выдано', value: data?.requests.issued ?? 0, icon: PackageCheck, accent: 'success' },
    { title: 'Не выдано', value: data?.requests.not_issued ?? 0, icon: Clock, accent: 'warning' },
    {
      title: 'Ожидают возврата',
      value: data?.requests.return_pending ?? 0,
      icon: TrendingUp,
      accent: 'danger',
    },
    {
      title: 'Возврат завершён',
      value: data?.requests.return_completed ?? 0,
      icon: CheckCircle2,
      accent: 'info',
    },
  ]

  const exitCards: StatCard[] = [
    {
      title: 'Всего выходов',
      value: data?.exits.total ?? 0,
      icon: BriefcaseBusiness,
      accent: 'info',
    },
    {
      title: 'Завершено',
      value: data?.exits.completed ?? 0,
      icon: CheckCircle2,
      accent: 'success',
    },
    { title: 'В ожидании', value: data?.exits.pending ?? 0, icon: Clock, accent: 'warning' },
  ]

  const applyPreset = (days: number) => {
    const toDate = new Date()
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - (days - 1))
    setFrom(toISODate(fromDate))
    setTo(toISODate(toDate))
  }

  const resetToMonth = () => {
    setFrom(defaultFrom())
    setTo(defaultTo())
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Аналитика"
        description="Сводка и динамика заявок и выходов сотрудников за выбранный период."
      />

      {/* Фильтр по датам */}
      <div className="rounded-3xl border border-border/60 bg-card/90 px-4 py-5 sm:px-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Период
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">С</label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-40 sm:w-44"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">По</label>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-40 sm:w-44"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset.days)}
                >
                  {preset.label}
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={resetToMonth}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Текущий месяц
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Загружаем аналитику…" />
      ) : isError ? (
        <ErrorState
          title="Не удалось загрузить аналитику"
          description="Проверьте выбранный диапазон дат и подключение, затем повторите попытку."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          {/* Заявки */}
          <div className="surface-section space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="surface-section__title">Статистика за период</p>
                <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                  <Package className="h-5 w-5 text-[hsl(var(--primary))]" />
                  Заявки
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {requestCards.map((card, i) => (
                <StatCardView key={card.title} card={card} index={i} />
              ))}
            </div>
          </div>

          {/* Выходы сотрудников */}
          <div className="surface-section space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="surface-section__title">Статистика за период</p>
                <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                  <BriefcaseBusiness className="h-5 w-5 text-[hsl(var(--primary))]" />
                  Выход сотрудников
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {exitCards.map((card, i) => (
                <StatCardView key={card.title} card={card} index={i} />
              ))}
            </div>
          </div>

          {/* Графики */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div
              className={cn(
                'rounded-3xl border border-border/60 bg-card/90 px-4 py-5 sm:px-6 shadow-sm'
              )}
            >
              <TrendChart title="Заявки" icon={Package} data={data?.request_trend ?? []} />
            </div>
            <div
              className={cn(
                'rounded-3xl border border-border/60 bg-card/90 px-4 py-5 sm:px-6 shadow-sm'
              )}
            >
              <TrendChart
                title="Выходы сотрудников"
                icon={BriefcaseBusiness}
                data={data?.exit_trend ?? []}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
